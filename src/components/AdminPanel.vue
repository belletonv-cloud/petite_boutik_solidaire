<template>
  <div class="admin-wrapper">

    <!-- NON CONNECTÉ -->
    <div v-if="!user" class="login-screen">
      <div class="login-card">
        <div class="login-logo">🛍️</div>
        <h1>La P'tite Boutik</h1>
        <p>Interface d'administration</p>
        <button class="btn-google" @click="login" :disabled="loading">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          {{ loading ? 'Connexion...' : 'Se connecter avec Google' }}
        </button>
        <p class="login-error" v-if="error">{{ error }}</p>
      </div>
    </div>

    <!-- CONNECTÉ MAIS PAS ADMIN -->
    <div v-else-if="!isAdmin" class="login-screen">
      <div class="login-card">
        <div class="login-logo">🚫</div>
        <h1>Accès refusé</h1>
        <p>{{ user.email }} n'est pas autorisé à accéder à cette interface.</p>
        <button class="btn-google" @click="switchAccount" :disabled="loading">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          🔄 {{ loading ? 'Connexion...' : 'Se connecter avec un autre compte' }}
        </button>
        <button class="btn-denied-logout" @click="logout">🚪 Se déconnecter</button>
        <p class="login-error" v-if="error">{{ error }}</p>
      </div>
    </div>

    <!-- ADMIN CONNECTÉ -->
    <div v-else class="admin-layout">
      <header class="admin-header">
        <h1>🛍️ Admin — La P'tite Boutik</h1>
        <div class="admin-header-right">
          <a href="https://petite-boutik-solidaire.pages.dev" target="_blank" rel="noopener" class="btn-preview-site">🌐 Voir le site</a>
          <button class="btn-preview-toggle" @click="showPreview = !showPreview" :title="showPreview ? 'Fermer l\'aperçu' : 'Ouvrir l\'aperçu'">
            {{ showPreview ? '✕ Fermer aperçu' : '👁 Aperçu' }}
          </button>
          <div class="admin-user">
            <img :src="user.photoURL" :alt="user.displayName" class="user-avatar" v-if="user.photoURL" />
            <span>{{ user.displayName }}</span>
            <button class="btn-switch-account" @click="switchAccount" title="Se connecter avec un autre compte Google">↔ Changer</button>
            <button class="btn-logout" @click="logout">Déconnexion</button>
          </div>
        </div>
      </header>

      <!-- Panneau preview iframe -->
      <div class="preview-panel" v-if="showPreview">
        <div class="preview-panel-bar">
          <span>Aperçu du site {{ previewMode === 'local' ? 'local' : 'déployé' }}</span>
          <button @click="togglePreviewMode" class="btn-refresh">{{ previewMode === 'local' ? '🌐 Site déployé' : '💻 Local' }}</button>
          <button @click="refreshPreview" class="btn-refresh">↺ Rafraîchir</button>
          <button @click="showPreview = false" class="btn-close-preview">✕</button>
        </div>
        <iframe :src="previewSrc" class="preview-iframe" title="Aperçu du site"></iframe>
      </div>

      <nav class="admin-nav">
        <button :class="{ active: tab === 'fermetures' }" @click="tab = 'fermetures'">📅 Fermetures</button>
        <button :class="{ active: tab === 'actualites' }" @click="tab = 'actualites'">📢 Actualités</button>
        <button :class="{ active: tab === 'galeries' }" @click="tab = 'galeries'">🖼️ Galeries</button>
        <button :class="{ active: tab === 'site' }" @click="tab = 'site'">🌐 Site</button>
        <button :class="{ active: tab === 'admins' }" @click="tab = 'admins'">👥 Admins</button>
      </nav>

      <main class="admin-main">

        <!-- FERMETURES EXCEPTIONNELLES -->
        <section v-if="tab === 'fermetures'">
          <h2>Fermetures exceptionnelles</h2>
          <p class="section-desc">Ces dates apparaîtront barrées dans le calendrier du site.</p>

          <div class="form-row">
            <input type="date" v-model="newClosure.date" class="input-date" />
            <input type="text" v-model="newClosure.label" placeholder="Motif (ex: Jour férié)" class="input-text" />
            <button class="btn-add" @click="addClosure" :disabled="!newClosure.date">Ajouter</button>
          </div>

          <div class="list">
            <div class="list-item" v-for="c in closures" :key="c.id">
              <span class="item-date">{{ formatDate(c.date) }}</span>
              <span v-if="editingClosure !== c.id" class="item-label" @click="startEditClosure(c)" title="Cliquer pour modifier le motif">{{ c.label || 'Fermeture exceptionnelle' }} ✏️</span>
              <span v-else class="item-label-edit">
                <input type="text" v-model="editingClosureLabel" class="input-text" @keyup.enter="saveClosureLabel(c)" @keyup.escape="editingClosure = null" />
                <button class="btn-add" style="padding:5px 10px;font-size:0.85em" @click="saveClosureLabel(c)">✓</button>
                <button class="btn-delete" @click="editingClosure = null">✕</button>
              </span>
              <button v-if="editingClosure !== c.id" class="btn-delete" @click="deleteClosure(c.id)">✕</button>
            </div>
            <p class="empty" v-if="closures.length === 0">Aucune fermeture exceptionnelle.</p>
          </div>

          <!-- Aperçu calendrier -->
          <div class="preview-block">
            <h3>Aperçu — cliquez sur une date pour fermer la boutique ce jour-là</h3>
            <div class="preview-calendar">
              <div
                v-for="date in previewDates"
                :key="date.iso"
                class="preview-date"
                :class="[date.weekday, { closed: date.closed, 'preview-clickable': !date.closed }]"
                @click="onPreviewDateClick(date)"
                :title="date.closed ? 'Cliquer pour annuler la fermeture' : 'Cliquer pour marquer fermé'"
              >
                <span class="preview-day">{{ date.day }}</span>
                <span class="preview-label">{{ date.label }}</span>
                <span class="preview-closed-tag" v-if="date.closed">{{ date.closureLabel }} — cliquer pour annuler</span>
                <span class="preview-add-tag" v-else>+ Ajouter fermeture</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ACTUALITÉS -->
        <section v-if="tab === 'actualites'">
          <h2>Encart actualités</h2>
          <p class="section-desc">Cet encart apparaît en haut du site. Laissez vide pour le masquer.</p>

          <div class="form-block">
            <label>Titre</label>
            <input type="text" v-model="actu.titre" placeholder="Ex: Vente spéciale ce samedi !" class="input-text full" />
            <label>Message</label>
            <textarea v-model="actu.message" placeholder="Détails de l'actualité..." class="input-textarea" rows="3"></textarea>
            <label>Type</label>
            <select v-model="actu.type" class="input-select">
              <option value="info">ℹ️ Info</option>
              <option value="warning">⚠️ Avertissement</option>
              <option value="success">✅ Bonne nouvelle</option>
            </select>
            <label class="checkbox-label">
              <input type="checkbox" v-model="actu.visible" />
              Afficher sur le site
            </label>
            <button class="btn-save" @click="saveActu">💾 Enregistrer</button>
            <span class="saved-msg" v-if="actuSaved">✓ Enregistré</span>
          </div>
        </section>

        <!-- GALERIES -->
        <section v-if="tab === 'galeries'">
          <h2>Galerie photos</h2>
          <p class="section-desc">Gérez toutes les photos du site : ajoutez, masquez, modifiez le texte ou supprimez.</p>

          <!-- Bloc ajout photo -->
          <div class="upload-block">
            <h3>➕ Ajouter une photo</h3>
            <div class="form-block" style="margin-top:14px;">
              <label>Photo</label>
              <input type="file" ref="fileInput" accept="image/*" multiple @change="onFileChange" class="input-file" />
               <div class="upload-previews" v-if="upload.previews.length">
                 <div v-for="(p, i) in upload.previews" :key="i" class="upload-preview-item">
                   <img :src="p" alt="Aperçu" />
                   <input type="text" v-model="upload.alts[i]" :placeholder="'Description ' + (i+1)" class="input-text upload-alt-input" />
                 </div>
               </div>
              <button class="btn-save" @click="uploadPhoto" :disabled="!upload.files.length || upload.uploading">
                {{ upload.uploading ? '⏳ Upload en cours...' : '⬆️ Envoyer les photos (' + upload.files.length + ')' }}
              </button>
              <span class="saved-msg" v-if="upload.done">✓ Photo ajoutée !</span>
              <span class="error-msg" v-if="upload.error">{{ upload.error }}</span>
            </div>
          </div>

          <!-- Photos avec fond supprimé (👕) -->
          <div class="gallery-section" v-if="photosWithBgRemoval.length">
            <div class="gallery-section-header">
              <h3>👕 Photos — fond supprimé <span class="photo-count">({{ photosWithBgRemoval.length }})</span></h3>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-bottom:8px;align-items:center">
              <div class="search-field" style="width:260px;position:relative">
                <input type="search" v-model="adminSearch" placeholder="Rechercher par alt ou tag" class="input-search" style="width:100%" />
                <button v-if="adminSearch" class="search-clear" @click="adminSearch = ''" title="Effacer la recherche">✕</button>
              </div>
            </div>
            <div class="gallery-grid">
              <div
                class="gallery-thumb"
                v-for="photo in photosWithBgRemovalFiltered"
                :key="photo._key"
                :class="{ inactive: !photo._active }"
              >
                <img :src="photo._srcThumb || photo._src" :alt="photo._displayAlt" loading="lazy" width="320" height="240" />
                <div class="thumb-overlay">
                  <label class="toggle-label">
                    <input type="checkbox" :checked="photo._active" @change="toggleDynamicPhoto(photo._raw)" />
                    <span>{{ photo._active ? 'Visible' : 'Masquée' }}</span>
                  </label>
                  <button class="thumb-bg-toggle active" @click="toggleRemoveBg(photo._raw)" title="Réafficher le décor">🖼</button>
                  <button class="thumb-delete" @click="deleteDynamicPhoto(photo._raw)" title="Supprimer">🗑</button>
                </div>
                <div class="thumb-edit-alt">
                  <input type="text" :value="altDraft[photo._key] ?? photo._displayAlt" @input="onAltInput(photo._key, $event.target.value)" @change="onAltSave(photo)" class="input-text thumb-alt-input" placeholder="Description" />
                  <span class="alt-saved" v-if="altSavedKey === photo._key">✓</span>
                </div>
                <div class="thumb-tags">
                  <input type="text" :value="tagDraft[photo._key] ?? (photo._raw.tags ? (Array.isArray(photo._raw.tags)?photo._raw.tags.join(', '):photo._raw.tags) : '')" @input="onTagInput(photo._key, $event.target.value)" @blur="onTagSave(photo)" class="input-text thumb-tag-input" placeholder="Tags (séparés par ,)" />
                </div>
              </div>
            </div>
          </div>

          <!-- Photos avec décor (🖼) -->
          <div class="gallery-section">
            <div class="gallery-section-header">
              <h3>🖼 Photos — avec décor <span class="photo-count">({{ photosWithDecor.length }})</span></h3>
              <div class="gallery-header-actions">
                <button class="btn-delete-all" @click="deleteAllDynamicPhotos">🗑 Tout supprimer</button>
              </div>
            </div>
            <p class="section-desc">Cochez/décochez pour afficher ou masquer. Modifiez le texte et cliquez ailleurs pour sauvegarder.</p>
            <div style="display:flex;justify-content:flex-end;margin-bottom:8px;align-items:center">
              <div class="search-field" style="width:260px;position:relative">
                <input type="search" v-model="adminSearch" placeholder="Rechercher par alt ou tag" class="input-search" style="width:100%" />
                <button v-if="adminSearch" class="search-clear" @click="adminSearch = ''" title="Effacer la recherche">✕</button>
              </div>
            </div>
            <div class="gallery-grid">
              <div
                class="gallery-thumb"
                v-for="photo in photosWithDecorFiltered"
                :key="photo._key"
                :class="{ inactive: !photo._active }"
              >
                <img :src="photo._srcThumb || photo._src" :alt="photo._displayAlt" loading="lazy" width="320" height="240" />
                <div class="thumb-overlay">
                  <label class="toggle-label">
                    <input type="checkbox" :checked="photo._active" @change="toggleDynamicPhoto(photo._raw)" />
                    <span>{{ photo._active ? 'Visible' : 'Masquée' }}</span>
                  </label>
                  <button class="thumb-bg-toggle" @click="toggleRemoveBg(photo._raw)" title="Supprimer le fond">👕</button>
                  <button class="thumb-delete" @click="deleteDynamicPhoto(photo._raw)" title="Supprimer">🗑</button>
                </div>
                <div class="thumb-edit-alt">
                  <input type="text" :value="altDraft[photo._key] ?? photo._displayAlt" @input="onAltInput(photo._key, $event.target.value)" @change="onAltSave(photo)" class="input-text thumb-alt-input" placeholder="Description" />
                  <span class="alt-saved" v-if="altSavedKey === photo._key">✓</span>
                </div>
                <div class="thumb-tags">
                  <input type="text" :value="tagDraft[photo._key] ?? (photo._raw.tags ? (Array.isArray(photo._raw.tags)?photo._raw.tags.join(', '):photo._raw.tags) : '')" @input="onTagInput(photo._key, $event.target.value)" @blur="onTagSave(photo)" class="input-text thumb-tag-input" placeholder="Tags (séparés par ,)" />
                </div>
              </div>
            </div>
            <p class="empty" v-if="!dynamicPhotos.length">Aucune photo pour l'instant. Ajoutez-en avec le formulaire ci-dessus.</p>
          </div>
        </section>

        <!-- SITE (blocs + textes) -->
        <section v-if="tab === 'site'">
          <h2>Contenu du site</h2>
          <p class="section-desc">Modifiez chaque bloc du site. Activez ou désactivez les sections. Les changements sont immédiats.</p>

          <div class="site-bloc" v-for="(bloc, index) in siteBlocs" :key="bloc.id"
            :draggable="bloc.id !== 'header'"
            @dragstart="bloc.id !== 'header' && onDragStart(index)"
            @dragover.prevent="bloc.id !== 'header' && onDragOver(index)"
            @dragend="onDragEnd"
            :class="{ 'drag-over': dragOverIndex === index, 'dragging': dragIndex === index, 'bloc-fixed': bloc.id === 'header' }"
          >
            <!-- En-tête du bloc -->
            <div class="bloc-header" @click="bloc.open = !bloc.open">
              <div class="bloc-header-left">
                <span class="bloc-icon">{{ bloc.icon }}</span>
                <div>
                  <strong class="bloc-title">{{ bloc.label }}</strong>
                  <span class="bloc-desc">{{ bloc.desc }}</span>
                </div>
              </div>
              <div class="bloc-header-right">
                <div class="bloc-reorder" @click.stop v-if="bloc.id !== 'header'">
                  <button class="reorder-btn" @click="moveBlocUp(index)" :disabled="index === 0 || (index === 1 && siteBlocs[0].id === 'header')" title="Monter">↑</button>
                  <button class="reorder-btn" @click="moveBlocDown(index)" :disabled="index === siteBlocs.length - 1" title="Descendre">↓</button>
                </div>
                <label class="visibility-toggle" @click.stop>
                  <input type="checkbox" :checked="isBlocVisible(bloc.id)" @change="toggleBloc(bloc.id)" />
                  <span class="toggle-track">
                    <span class="toggle-thumb"></span>
                  </span>
                  <span class="toggle-text">{{ isBlocVisible(bloc.id) ? 'Visible' : 'Masqué' }}</span>
                </label>
                <label class="nav-toggle" @click.stop v-if="bloc.id !== 'header'">
                  <input type="checkbox" :checked="isBlocInNav(bloc.id)" @change="toggleBlocNav(bloc.id)" />
                  <span class="toggle-track sm">
                    <span class="toggle-thumb"></span>
                  </span>
                  <span class="toggle-text">{{ isBlocInNav(bloc.id) ? 'Menu' : '—' }}</span>
                </label>
                <span class="bloc-chevron">{{ bloc.open ? '▲' : '▼' }}</span>
              </div>
            </div>

            <!-- Contenu éditable (déroulé) -->
            <div class="bloc-body" v-if="bloc.open && bloc.fields && bloc.fields.length && bloc.id !== 'calendrier' && bloc.id !== 'collection'">

              <!-- Éditeur dégradé spécial pour le hero -->
              <div v-if="bloc.id === 'hero'" class="gradient-editor">
                <label class="gradient-label">Présets de dégradés</label>
                <div class="gradient-presets">
                  <button
                    v-for="p in gradientPresets"
                    :key="p.name"
                    class="preset-swatch"
                    :style="{ background: `linear-gradient(${textesValues.hero_gradient_angle || 135}deg, ${p.start} 0%, ${p.end} 100%)` }"
                    :title="p.name"
                    @click="applyGradientPreset(p)"
                  ></button>
                </div>
                <div class="gradient-preview" :style="{ background: `linear-gradient(${textesValues.hero_gradient_angle || 135}deg, ${textesValues.hero_gradient_start || '#1BA9A8'} 0%, ${textesValues.hero_gradient_end || '#E95E5E'} 100%)` }">
                  <span>Aperçu du dégradé</span>
                </div>
              </div>

              <div class="form-block" v-for="field in bloc.fields" :key="field.id">
                <label>{{ field.label }}</label>

                <!-- Toggle -->
                <label v-if="field.type === 'toggle'" class="inline-toggle">
                  <input type="checkbox" :checked="textesValues[field.id] !== false && textesValues[field.id] !== 'false'" @change="e => textesValues[field.id] = e.target.checked" />
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                  <span class="toggle-text">{{ (textesValues[field.id] !== false && textesValues[field.id] !== 'false') ? 'Visible' : 'Masqué' }}</span>
                </label>

                <!-- Color picker -->
                <div v-else-if="field.type === 'color'" class="color-input-row">
                  <input type="color" v-model="textesValues[field.id]" class="input-color" />
                  <input type="text" v-model="textesValues[field.id]" class="input-text" placeholder="#000000" style="width:110px;flex:none" />
                  <div class="color-palette">
                    <button
                      v-for="c in COLOR_PALETTE" :key="c"
                      type="button"
                      class="palette-swatch"
                      :style="{ background: c }"
                      :title="c"
                      @click="applyColor(field.id, c)"
                    ></button>
                  </div>
                </div>

                <!-- Number -->
                <input
                  v-else-if="field.type === 'number'"
                  type="number"
                  v-model.number="textesValues[field.id]"
                  class="input-text"
                  style="width:90px"
                  :placeholder="field.default"
                />

                <!-- List (JSON) -->
                <div v-else-if="field.type === 'list'">
                  <!-- recognition_items special UI -->
                  <div v-if="field.id === 'recognition_items'" class="recognition-admin">
                  <div class="recognition-admin-item" v-for="(item, idx) in (textesValues[field.id] || [])" :key="idx" draggable="true" @dragstart="onRecognitionDragStart(idx)" @dragover.prevent="onRecognitionDragOver(idx)" @drop="onRecognitionDrop(idx)">
                      <div class="recognition-row">
                        <input type="text" v-model="item.text" placeholder="Texte (ex: Partenaire X)" class="input-text full" />
                        <input type="text" v-model="item.icon" @input="item.icon = sanitizeIconInput(item.icon)" placeholder="Icône (emoji)" class="input-text" style="width:120px;margin-left:8px" />
                      </div>
                      <div class="recognition-row" style="align-items:center;margin-top:8px">
                        <div class="recognition-preview" style="width:120px;height:80px;border:1px dashed #ddd;display:flex;align-items:center;justify-content:center;margin-right:8px">
                          <img v-if="item.src" :src="item.src" style="max-width:100%;max-height:100%" />
                          <span v-else style="color:#999;font-size:0.85em">Aucune image</span>
                        </div>
                        <div style="display:flex;gap:8px;align-items:center">
                          <input type="file" accept="image/*" @change="e => onRecognitionFileChange(e, idx)" />
                          <button class="btn-delete" @click="removeRecognitionItem(idx)">Supprimer</button>
                        </div>
                        <div style="margin-left:auto;display:flex;gap:6px">
                          <button class="btn" @click="moveRecognitionUp(idx)" :disabled="idx===0" title="Monter">↑</button>
                          <button class="btn" @click="moveRecognitionDown(idx)" :disabled="idx >= (textesValues[field.id]?.length || 0) - 1" title="Descendre">↓</button>
                        </div>
                      </div>
                    </div>
                    <div style="margin-top:8px">
                      <button class="btn-add-regle" @click="addRecognitionItem">+ Ajouter un élément</button>
                    </div>
                  </div>
                  <textarea v-else class="input-textarea" rows="6" :value="JSON.stringify(textesValues[field.id] || [], null, 2)" @input="e => { try { textesValues[field.id] = JSON.parse(e.target.value) } catch (err) { /* ignore parse errors while typing */ } }"></textarea>
                </div>

                <!-- Textarea (special-case WYSIWYG for mentions_content) -->
                <div v-else-if="field.multiline">
                  <div v-if="field.id === 'mentions_content'" class="mentions-editor-block">
                    <div class="mentions-toolbar">
                      <button type="button" @click.prevent="document.execCommand('bold')">B</button>
                      <button type="button" @click.prevent="document.execCommand('italic')">I</button>
                      <button type="button" @click.prevent="{ const url = prompt('URL'); if(url) document.execCommand('createLink', false, url) }">🔗</button>
                      <button type="button" @click.prevent="document.execCommand('insertUnorderedList')">• Liste</button>
                    </div>
                    <div
                      class="mentions-editor"
                      contenteditable
                      :inner-html="textesValues[field.id]"
                      @input="e => textesValues[field.id] = e.target.innerHTML"
                      v-html="textesValues[field.id] || field.default"
                    ></div>
                    <div class="mentions-help">Éditeur simple. Le HTML est sanitizé avant affichage public.</div>
                  </div>
                  <textarea v-else v-model="textesValues[field.id]" class="input-textarea" :placeholder="field.default" rows="3"></textarea>
                </div>

                <!-- Text par défaut -->
                <input
                  v-else
                  type="text"
                  v-model="textesValues[field.id]"
                  class="input-text full"
                  :placeholder="field.default"
                />
              </div>
              <div class="bloc-actions">
                <button class="btn-save" @click="saveTextesForBloc(bloc)">💾 Enregistrer</button>
                <span class="saved-msg" v-if="bloc.saved">✓ Enregistré</span>
              </div>
            </div>
            <div class="bloc-body bloc-no-fields" v-else-if="bloc.open && (!bloc.fields || !bloc.fields.length)">
              <p class="section-desc" style="margin:0">Ce bloc n'a pas de texte modifiable — gérez-le via le toggle Visible/Masqué.</p>
            </div>
            <!-- Corps spécial calendrier/horaires -->
            <div class="bloc-body" v-if="bloc.open && bloc.id === 'calendrier'">
              <p class="horaires-intro">Définissez les jours et semaines d'ouverture. Le calendrier et les cartes horaires sont mis à jour automatiquement.</p>

              <div class="form-block">
                <label>Titre du calendrier</label>
                <input type="text" v-model="horairesTitreCalendrier" class="input-text full" placeholder="Calendrier d'ouverture" />
              </div>
              <div class="form-block">
                <label>Titre de la section horaires</label>
                <input type="text" v-model="horairesTitreSection" class="input-text full" placeholder="Horaires d'ouverture" />
              </div>

              <div class="regle-bloc" v-for="(regle, ri) in horairesRegles" :key="ri">
                <div class="regle-header">
                  <strong>Jour d'ouverture {{ ri + 1 }}</strong>
                  <button class="btn-remove-regle" @click="removeRegle(ri)" title="Supprimer">✕</button>
                </div>
                <div class="regle-row">
                  <label>Emoji :</label>
                  <input type="text" v-model="regle.emoji" class="regle-emoji" placeholder="📅" maxlength="2" />
                </div>
                <div class="regle-row">
                  <label>Jour :</label>
                  <select :value="regle.jour" @change="e => updateRegleJour(regle, e.target.value)" class="regle-select">
                    <option v-for="j in JOURS_OPTIONS" :key="j.num" :value="j.num">{{ j.label }}</option>
                  </select>
                </div>
                <div class="regle-row">
                  <label>Semaines du mois :</label>
                  <div class="semaines-btns">
                    <button
                      v-for="s in SEMAINES_OPTIONS" :key="s.num"
                      :class="['semaine-btn', { active: regle.semaines.includes(s.num) }]"
                      @click="toggleSemaine(regle, s.num)"
                    >{{ s.label }}</button>
                  </div>
                </div>
                <div class="regle-row">
                  <label>Couleur :</label>
                  <input type="color" v-model="regle.color" class="regle-color" />
                  <span class="color-hex">{{ regle.color }}</span>
                  <div class="color-palette">
                    <button
                      v-for="c in COLOR_PALETTE" :key="c"
                      type="button"
                      class="palette-swatch"
                      :style="{ background: c }"
                      :title="c"
                      @click="applyRegleColor(regle, c)"
                    ></button>
                  </div>
                </div>
                <div class="regle-row">
                  <label>Texte affiché dans la carte horaires :</label>
                  <input type="text" v-model="regle.texte_jours" class="input-text full" placeholder="ex: Les 1ers et 3èmes mercredis du mois" />
                </div>
              </div>

              <button class="btn-add-regle" @click="addRegle">+ Ajouter un jour d'ouverture</button>

              <div class="form-block" style="margin-top:18px">
                <label>Plage horaire</label>
                <input type="text" v-model="horairesPlageTxt" class="input-text full" placeholder="10h00 – 17h30 sans interruption" />
              </div>
              <div class="form-block">
                <label>Texte accueil bénévoles</label>
                <input type="text" v-model="horairesBenevoles" class="input-text full" placeholder="Accueil par une équipe de bénévoles..." />
              </div>

              <div class="bloc-actions">
                <button class="btn-save" @click="saveHoraires">💾 Enregistrer les horaires</button>
                <span class="saved-msg" v-if="horairesSaved">✓ Enregistré</span>
              </div>

              <!-- Aperçu calendrier -->
              <div class="cal-preview">
                <h4>Aperçu — prochaines ouvertures calculées</h4>
                <div class="cal-preview-grid">
                <div
                  v-for="d in calPreview" :key="d.iso"
                  class="cal-preview-item"
                  :style="{ borderLeftColor: d.color || '#1BA9A8', color: d.color || '#1BA9A8' }"
                >
                  <span class="cal-day">{{ d.day }}</span>
                  <span class="cal-date">{{ d.label }}</span>
                </div>
                </div>
              </div>
            </div>

            <!-- Bloc spécial Products -->
            <div class="bloc-body" v-if="bloc.open && bloc.id === 'collection'">
              <!-- Champs textes standards -->
              <div class="form-block" v-for="field in bloc.fields" :key="field.id">
                <label>{{ field.label }}</label>
                <input type="text" v-model="textesValues[field.id]" class="input-text full" :placeholder="field.default" />
              </div>

              <!-- Liste produits -->
              <div class="form-block" style="margin-top:16px">
                <label>Produits proposés</label>
                <div class="items-list">
                  <div class="items-row" v-for="(item, i) in textesValues.products_items" :key="i">
                    <input type="text" v-model="item.emoji" class="input-text" style="width:50px;text-align:center" placeholder="👕" />
                    <input type="text" v-model="item.texte" class="input-text full" placeholder="Description du produit" />
                    <button class="btn-remove-regle" @click="textesValues.products_items.splice(i,1)" title="Supprimer">✕</button>
                  </div>
                </div>
                <button class="btn-add-regle" style="margin-top:8px" @click="textesValues.products_items.push({emoji:'👕', texte:''})">+ Ajouter un produit</button>
              </div>

              <!-- Marques -->
              <div class="form-block" style="margin-top:16px">
                <label>Marques (une par ligne)</label>
                <textarea
                  class="input-textarea"
                  rows="4"
                  :value="textesValues.products_brands.join('\n')"
                  @input="e => textesValues.products_brands = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)"
                  placeholder="Sergent Major&#10;Okaidi&#10;Jacadi..."
                ></textarea>
              </div>

              <!-- Tarifs -->
              <div class="form-block" style="margin-top:16px">
                <label>Tarifs</label>
                <div class="items-list">
                  <div class="items-row" v-for="(p, i) in textesValues.products_prices" :key="i">
                    <input type="text" v-model="p.label" class="input-text" style="width:120px" placeholder="Hauts" />
                    <input type="text" v-model="p.price" class="input-text" style="width:90px" placeholder="1,00 €" />
                    <button class="btn-remove-regle" @click="textesValues.products_prices.splice(i,1)" title="Supprimer">✕</button>
                  </div>
                </div>
                <button class="btn-add-regle" style="margin-top:8px" @click="textesValues.products_prices.push({label:'',price:''})">+ Ajouter un tarif</button>
              </div>

              <div class="bloc-actions" style="margin-top:18px">
                <button class="btn-save" @click="saveTextesForBloc(bloc)">💾 Enregistrer</button>
                <span class="saved-msg" v-if="bloc.saved">✓ Enregistré</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ADMINS -->
        <section v-if="tab === 'admins'">
          <h2>Administrateurs autorisés</h2>
          <p class="section-desc">Emails Google autorisés à accéder à cette interface.</p>

          <div class="form-row">
            <input type="email" v-model="newAdminEmail" placeholder="adresse@gmail.com" class="input-text" />
            <button class="btn-add" @click="addAdmin" :disabled="!newAdminEmail">Ajouter</button>
          </div>

          <div class="list">
            <div class="list-item" v-for="a in adminList" :key="a.id">
              <span class="item-label">{{ a.email }}</span>
              <button class="btn-delete" @click="deleteAdmin(a.id)" :disabled="a.email === user.email">✕</button>
            </div>
          </div>
        </section>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  collection, doc, getDocs, getDoc, addDoc, deleteDoc, setDoc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, googleProvider, db, storage } from '../firebase.js'
import { ADMIN_EMAILS } from '../admins.js'

const user = ref(null)
const isAdmin = ref(false)
const loading = ref(false)
const error = ref('')
const tab = ref('fermetures')

// Preview iframe
const showPreview = ref(false)
const previewMode = ref('local')
const previewTs = ref(0)
const previewSrc = computed(() => {
  const base = previewMode.value === 'local' ? 'http://localhost:5173' : 'https://petite-boutik-solidaire.pages.dev'
  return base + '?t=' + previewTs.value
})
const refreshPreview = () => { previewTs.value = Date.now() }
const togglePreviewMode = () => {
  previewMode.value = previewMode.value === 'local' ? 'deployed' : 'local'
  refreshPreview()
}

// Drag & drop blocs
const dragIndex = ref(null)
const dragOverIndex = ref(null)
const saveBlocsOrder = async () => {
  const order = siteBlocs.value.filter(b => b.id !== 'header').map(b => b.id)
  const existingSnap = await getDoc(doc(db, 'config', 'blocs'))
  const existing = existingSnap.exists() ? existingSnap.data() : {}
  await setDoc(doc(db, 'config', 'blocs'), { ...existing, _order: order })
}

const onDragStart = (i) => { dragIndex.value = i }
const onDragOver = (i) => { dragOverIndex.value = i }
const onDragEnd = () => {
  if (dragIndex.value !== null && dragOverIndex.value !== null && dragIndex.value !== dragOverIndex.value) {
    const arr = [...siteBlocs.value]
    const [moved] = arr.splice(dragIndex.value, 1)
    arr.splice(dragOverIndex.value, 0, moved)
    siteBlocs.value = arr
    saveBlocsOrder()
  }
  dragIndex.value = null
  dragOverIndex.value = null
}
const moveBlocUp = (i) => {
  if (i === 0) return
  if (siteBlocs.value[i].id === 'header') return
  const arr = [...siteBlocs.value];
  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
  siteBlocs.value = arr
  saveBlocsOrder()
}
const moveBlocDown = (i) => {
  if (i === siteBlocs.value.length - 1) return
  if (siteBlocs.value[i].id === 'header') return
  const arr = [...siteBlocs.value];
  [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
  siteBlocs.value = arr
  saveBlocsOrder()
}

// Présets dégradés
const gradientPresets = [
  { name: 'Teal → Coral (défaut)', start: '#1BA9A8', end: '#E95E5E' },
  { name: 'Coral → Teal', start: '#E95E5E', end: '#1BA9A8' },
  { name: 'Teal → Beige', start: '#1BA9A8', end: '#F5E6D3' },
  { name: 'Coral → Beige', start: '#E95E5E', end: '#F5E6D3' },
  { name: 'Violet → Rose', start: '#7C3AED', end: '#F472B6' },
  { name: 'Bleu → Cyan', start: '#1D4ED8', end: '#06B6D4' },
  { name: 'Vert → Teal', start: '#059669', end: '#1BA9A8' },
  { name: 'Marron → Beige', start: '#8B6F47', end: '#F5E6D3' },
]
const applyGradientPreset = (p) => {
  textesValues.value.hero_gradient_start = p.start
  textesValues.value.hero_gradient_end = p.end
}

// Fermetures
const closures = ref([])
const newClosure = ref({ date: '', label: '' })

// Actualités
const actu = ref({ titre: '', message: '', type: 'info', visible: false })
const actuSaved = ref(false)

// Blocs du site — structure style Wix
const blocsState = ref({})  // { hero: { visible: true }, about: { visible: true }, ... }

const BLOCS_DEFAULTS = {
  hero: true, about: true, carousel: true,
  collection: true, association: true, calendrier: true,
  engagement: true, contact: true, social: true,
  header: true,
}

const isBlocVisible = (id) => {
  if (blocsState.value[id] === undefined) return BLOCS_DEFAULTS[id] ?? true
  return blocsState.value[id].visible !== false
}

const toggleBloc = async (id) => {
  const newVal = !isBlocVisible(id)
  blocsState.value[id] = { ...(blocsState.value[id] || {}), visible: newVal }
  await setDoc(doc(db, 'config', 'blocs'), blocsState.value)
}

const isBlocInNav = (id) => {
  if (blocsState.value[id] === undefined) return true
  return blocsState.value[id].showInNav !== false
}

const toggleBlocNav = async (id) => {
  const newVal = !isBlocInNav(id)
  blocsState.value[id] = { ...(blocsState.value[id] || {}), showInNav: newVal }
  await setDoc(doc(db, 'config', 'blocs'), blocsState.value)
}

const loadBlocs = () => {
  onSnapshot(doc(db, 'config', 'blocs'), snap => {
    if (snap.exists()) {
      blocsState.value = snap.data()
      // Réordonner siteBlocs selon l'ordre sauvegardé
      const order = snap.data()._order
      if (Array.isArray(order) && order.length) {
        siteBlocs.value = [...siteBlocs.value].sort((a, b) => {
          const ia = order.indexOf(a.id)
          const ib = order.indexOf(b.id)
          if (ia === -1) return 1
          if (ib === -1) return -1
          return ia - ib
        })
      }
    }
  })
}

  // Textes (valeurs en direct)
  const textesValues = ref({
  hero_tagline: '',
  about_titre: '',
  about_texte: '',
  horaires_texte: '',
  association_texte: '',
  association_titre: '',
  dons_texte: '',
  dons_texte2: '',
  dons_visible: true,
  // Header
  header_titre: '',
  header_tagline: '',
  // Hero dégradé
  hero_gradient_start: '#1BA9A8',
  hero_gradient_end: '#E95E5E',
  hero_gradient_angle: 135,
  // Hero boutons
  hero_btn1_label: 'Voir les horaires',
  hero_btn1_visible: true,
  hero_btn2_label: 'Nous contacter',
  hero_btn2_visible: true,
  // Contact
  contact_address: '',
  contact_titre: '',
  contact_phone: '',
  contact_phone_raw: '',
  contact_map_url: '',
  // Social
  social_facebook_url: '',
  social_titre: '',
  social_facebook_handle: '',
  social_instagram_url: '',
  social_instagram_handle: '',
  // Engagement
  engagement_quote: '',
  engagement_titre: '',
  // Products
  products_titre: '',
  products_sous: '',
  products_marques_titre: '',
  products_tarifs_titre: '',
  products_bienvenue: '',
  products_items: [],
  products_brands: [],
  products_prices: [],
  recognition_items: [],
  // Sticky bottom bar
  sticky_phone: '06 20 70 54 96',
  sticky_phone_raw: '0620705496',
  sticky_address: '2 rue Jean-Monnet, Morlaix',
  sticky_hours: '1er/3e mer. & sam. 10h-17h30',
})

// Définition des blocs avec leurs champs éditables
const siteBlocs = ref([
  {
    id: 'header', icon: '🏷️', label: 'En-tête du site', open: false, saved: false,
    desc: 'Nom de la boutique et sous-titre affiché en haut',
    fields: [
      { id: 'header_titre', label: 'Titre principal', multiline: false, default: 'La P\'tite Boutik Solidaire' },
      { id: 'header_tagline', label: 'Sous-titre', multiline: false, default: 'Association Bras Ouverts de Morlaix' },
    ]
  },
  {
    id: 'hero', icon: '🎨', label: "Bandeau d'accueil", open: false, saved: false,
    desc: 'Grande accroche, dégradé de fond et boutons',
    fields: [
      { id: 'hero_tagline', label: 'Texte accroche', multiline: true, default: "" },
      { id: 'hero_gradient_start', label: 'Couleur de début du dégradé', type: 'color', default: '#1BA9A8' },
      { id: 'hero_gradient_end', label: 'Couleur de fin du dégradé', type: 'color', default: '#E95E5E' },
      { id: 'hero_gradient_angle', label: 'Angle du dégradé (°)', type: 'number', default: 135 },
      { id: 'hero_btn1_label', label: 'Bouton 1 — texte', type: 'text', default: 'Horaires' },
      { id: 'hero_btn1_visible', label: 'Bouton 1 — visible', type: 'toggle', default: true },
      { id: 'hero_btn2_label', label: 'Bouton 2 — texte', type: 'text', default: 'Nous contacter' },
      { id: 'hero_btn2_visible', label: 'Bouton 2 — visible', type: 'toggle', default: true },
    ]
  },
  {
    id: 'about', icon: '📖', label: 'À propos', open: false, saved: false,
    desc: 'Texte de présentation de la boutique',
    fields: [
      { id: 'about_titre', label: 'Titre de section', multiline: false, default: 'À propos' },
      { id: 'about_texte', label: 'Texte À propos', multiline: true, default: "La P'tite Boutik Solidaire ouvre ses portes au 2, rue Jean-Monnet à Morlaix. Portée par l'Association Bras Ouverts de Morlaix, l'objectif de ce nouveau lieu est d'encourager le recyclage, de favoriser la convivialité à travers la mode enfantine responsable et d'aider les familles." }]
  },
  {
    id: 'carousel', icon: '🖼️', label: 'Galerie photos', open: false, saved: false,
    desc: 'Carrousel de photos (gérez les photos dans Galeries)',
    fields: []
  },
  {
    id: 'collection', icon: '🏷️', label: 'Ce que nous proposons', open: false, saved: false,
    desc: 'Titre, liste de produits, marques, tarifs',
    fields: [
      { id: 'products_titre', label: 'Titre de section', multiline: false, default: 'Ce que nous proposons' },
      { id: 'products_sous', label: 'Sous-titre', multiline: false, default: 'Vêtements de seconde main en excellent état :' },
      { id: 'products_marques_titre', label: 'Titre marques', multiline: false, default: 'Des marques de qualité' },
      { id: 'products_tarifs_titre', label: 'Titre tarifs', multiline: false, default: 'Exemples de tarifs' },
      { id: 'products_bienvenue', label: 'Phrase de bienvenue', multiline: false, default: 'Soyez les bienvenu(e)s !' },
    ]
  },
      {
        id: 'association', icon: '🤝', label: 'Bloc Association', open: false, saved: false,
        desc: 'Texte association Bras Ouverts + appel aux dons',
        fields: [
      { id: 'association_titre', label: 'Titre de section', multiline: false, default: "L'Association Bras Ouverts" },
      { id: 'association_texte', label: 'Texte association', multiline: true, default: "L'Association Bras Ouverts de Morlaix est portée par des bénévoles engagées — mamans, amies et mamies — qui œuvrent chaque jour pour créer du lien social et soutenir les familles du territoire." },
      { id: 'dons_texte', label: 'Texte appel aux dons (1er §)', multiline: true, default: "Nous acceptons avec gratitude vos dons de vêtements enfants (0-10 ans) en bon état, chaussures, matériel de puériculture et vêtements pour futures mamans." },
        { id: 'dons_texte2', label: 'Texte appel aux dons (2e §)', multiline: true, default: "Apportez vos dons directement à la boutique aux horaires d'ouverture." },
        { id: 'dons_visible', label: 'Section « Vous souhaitez donner ? » visible', type: 'toggle', default: true },
        // Recognition list (Ils nous font confiance)
        { id: 'recognition_items', label: 'Ils nous font confiance — éléments (JSON liste)', type: 'list', default: [] },
        // Mentions légales gérées ici
        { id: 'mentions_title', label: 'Mentions — Titre', multiline: false, default: '✅ Mentions légales – La P’tite Boutik Solidaire' },
        { id: 'mentions_content', label: 'Mentions — Contenu HTML', multiline: true, default: '' },
      ]
      },
  {
    id: 'calendrier', icon: '📅', label: 'Calendrier', open: false, saved: false,
    desc: 'Prochaines dates d\'ouverture (gérez les fermetures dans Fermetures)',
    fields: [{ id: 'horaires_texte', label: 'Horaires (affiché dans Horaires)', multiline: false, default: '10h00 – 17h30 sans interruption' }]
  },
  {
    id: 'engagement', icon: '💛', label: 'Bloc Engagement', open: false, saved: false,
    desc: 'Citation et badges de valeurs',
    fields: [
      { id: 'engagement_titre', label: 'Titre de section', multiline: false, default: 'Notre engagement' },
      { id: 'engagement_quote', label: 'Citation', multiline: true, default: 'Nous voulons que chaque visiteur se sente attendu et bienvenu. Ici, on recycle, on partage, on crée du lien.' },
    ]
  },
  {
    id: 'contact', icon: '📍', label: 'Contact', open: false, saved: false,
    desc: 'Adresse, téléphone, lien Google Maps',
    fields: [
      { id: 'contact_titre', label: 'Titre de section', multiline: false, default: 'Nous trouver' },
      { id: 'contact_address', label: 'Adresse', multiline: false, default: '2 rue Jean-Monnet, 29600 Morlaix' },
      { id: 'contact_phone', label: 'Téléphone (affichage)', multiline: false, default: '06 20 70 54 96' },
      { id: 'contact_phone_raw', label: 'Téléphone (pour lien tel:)', multiline: false, default: '0620705496' },
      { id: 'contact_map_url', label: 'URL embed Google Maps', multiline: true, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2688.5!2d-3.8275!3d48.5775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s2+Rue+Jean+Monnet%2C+29600+Morlaix!5e0!3m2!1sfr!2sfr!4v1700000000000' },
    ]
  },
  {
    id: 'social', icon: '📱', label: 'Réseaux sociaux', open: false, saved: false,
    desc: 'Liens Facebook / Instagram',
    fields: [
      { id: 'social_titre', label: 'Titre de section', multiline: false, default: 'Suivez-nous !' },
      { id: 'social_facebook_url', label: 'URL Facebook', multiline: false, default: 'https://www.facebook.com/people/La-Ptite-Boutik-Solidaire-Morlaix/61581840912607/' },
      { id: 'social_facebook_handle', label: 'Nom affiché Facebook', multiline: false, default: 'La P\'tite Boutik Solidaire' },
      { id: 'social_instagram_url', label: 'URL Instagram', multiline: false, default: 'https://www.instagram.com/la_ptite_boutik_morlaix/' },
      { id: 'social_instagram_handle', label: 'Nom affiché Instagram', multiline: false, default: '@la_ptite_boutik_morlaix' },
    ]
  },
  {
    id: 'sticky', icon: '⬇️', label: 'Barre en bas', open: false, saved: false,
    desc: 'Barre fixe tout en bas de l\'écran (téléphone, adresse, horaires)',
    fields: [
      { id: 'sticky_phone', label: 'Téléphone (affichage)', multiline: false, default: '06 20 70 54 96' },
      { id: 'sticky_phone_raw', label: 'Téléphone (pour lien tel:)', multiline: false, default: '0620705496' },
      { id: 'sticky_address', label: 'Adresse', multiline: false, default: '2 rue Jean-Monnet, Morlaix' },
      { id: 'sticky_hours', label: 'Horaires', multiline: false, default: '1er/3e mer. & sam. 10h-17h30' },
    ]
  },
])

const DEFAULT_PRODUCTS_ITEMS = [
  { emoji: '👕', texte: 'Vêtements pour les enfants de 0 à 10 ans' },
  { emoji: '👟', texte: 'Chaussures' },
  { emoji: '🧸', texte: "Jouets, tapis d'éveil, livres" },
  { emoji: '🛒', texte: 'Matériel de puériculture (poussettes, siège auto, écharpe de portage, chaise haute…)' },
  { emoji: '🤱', texte: 'Vêtements pour futures mamans' },
]
const DEFAULT_PRODUCTS_BRANDS = ['Sergent Major','Okaidi','Jacadi','Vert Baudet','IKKS','Du Pareil au Même','Petit Bateau','Terre de Marins','Nike','…']
const DEFAULT_PRODUCTS_PRICES = [
  { label: 'Hauts', price: '1,00 €' },
  { label: 'Bas', price: '1,50 €' },
  { label: 'Chaussures', price: '2,00 €' },
]

const loadTextes = () => {
  onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (snap.exists()) {
      const data = snap.data()
      Object.keys(textesValues.value).forEach(k => {
        if (data[k] !== undefined) textesValues.value[k] = data[k]
      })
      // If mentions_content is present, keep it; otherwise, set default content
      if (!data.mentions_content && !textesValues.value.mentions_content) {
        textesValues.value.mentions_content = ''
      }
      // Fallbacks pour les tableaux si non encore enregistrés
  if (!textesValues.value.products_items || !textesValues.value.products_items.length)
        textesValues.value.products_items = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS_ITEMS))
      if (!textesValues.value.products_brands || !textesValues.value.products_brands.length)
        textesValues.value.products_brands = [...DEFAULT_PRODUCTS_BRANDS]
      if (!textesValues.value.products_prices || !textesValues.value.products_prices.length)
        textesValues.value.products_prices = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS_PRICES))
      if (!textesValues.value.recognition_items || !textesValues.value.recognition_items.length)
        textesValues.value.recognition_items = [
          { text: 'À la une dans la presse locale', icon: '📰', src: '/documents/PHOTO-2026-05-02-21-17-283.jpg' }
        ]
    }
  })
}

// Recognition admin helpers (file upload to Firebase Storage)
const onRecognitionFileChange = async (e, idx) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  try {
    const ext = f.name.split('.').pop()
    const fileName = `recognition/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const snapshot = await uploadBytes(storageRef(storage, fileName), f)
    const url = await getDownloadURL(snapshot.ref)
    if (!textesValues.value.recognition_items) textesValues.value.recognition_items = []
    textesValues.value.recognition_items[idx].src = url
  } catch (err) {
    console.warn('upload recognition image error', err)
  }
}

const addRecognitionItem = () => {
  if (!textesValues.value.recognition_items) textesValues.value.recognition_items = []
  textesValues.value.recognition_items.push({ text: '', icon: '', src: '' })
}

const removeRecognitionItem = (idx) => {
  textesValues.value.recognition_items.splice(idx, 1)
}

const moveRecognitionUp = (idx) => {
  if (idx <= 0) return
  const arr = textesValues.value.recognition_items
  ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
}

const moveRecognitionDown = (idx) => {
  const arr = textesValues.value.recognition_items
  if (idx >= arr.length - 1) return
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
}

// drag & drop reorder helpers
let _dragIndex = null
const onRecognitionDragStart = (i) => { _dragIndex = i }
const onRecognitionDragOver = (i) => { /* noop for now */ }
const onRecognitionDrop = (i) => {
  if (_dragIndex === null) return
  const arr = textesValues.value.recognition_items
  const [moved] = arr.splice(_dragIndex, 1)
  arr.splice(i, 0, moved)
  _dragIndex = null
}

// sanitize icon input to allow only emoji/short text (strip tags)
const sanitizeIconInput = (s) => {
  if (!s) return ''
  return String(s).replace(/<[^>]*>/g, '').slice(0, 8)
}

const saveTextesForBloc = async (bloc) => {
  const data = {}
  ;(bloc.fields || []).forEach(f => { data[f.id] = textesValues.value[f.id] })
  const existingSnap = await getDoc(doc(db, 'config', 'textes'))
  const existing = existingSnap.exists() ? existingSnap.data() : {}
  await setDoc(doc(db, 'config', 'textes'), { ...existing, ...data })
  bloc.saved = true
  setTimeout(() => bloc.saved = false, 2000)
}

// Admins
const adminList = ref([])
const newAdminEmail = ref('')

// Photos (toutes dans Cloudinary / Firestore)
const dynamicPhotos = ref([])

// Édition du texte des photos (draft local avant sauvegarde)
const altDraft = ref({})
const altSavedKey = ref('')

const onAltInput = (key, val) => {
  altDraft.value[key] = val
}

const onAltSave = (photo) => {
  const val = altDraft.value[photo._key]
  if (val === undefined) return
  delete altDraft.value[photo._key]
  saveDynamicPhotoAlt(photo._raw, val)
  altSavedKey.value = photo._key
  setTimeout(() => { altSavedKey.value = '' }, 2000)
}

// Tag editing support (admin)
const adminSearch = ref('')
const tagDraft = ref({})

const onTagInput = (key, val) => {
  tagDraft.value[key] = val
}

const onTagSave = async (photo) => {
  const raw = photo._raw
  const val = tagDraft.value[photo._key]
  if (val === undefined) return
  delete tagDraft.value[photo._key]
  // Normalize: split by comma into array, trim, remove empties
  const tags = val.split(',').map(s => s.trim()).filter(Boolean)
  await setDoc(doc(db, 'photos', raw.id), { ...raw, tags })
}

const mergedPhotos = computed(() =>
  dynamicPhotos.value.map(p => ({
    _key: p.id,
    id: p.id,
    _raw: p,
    _src: p.url,
    _srcThumb: (p.url && p.url.includes('/upload/')) ? p.url.replace('/upload/', '/upload/w_320,h_240,c_fill,f_auto,q_auto/') : p.url,
    _displayAlt: p.alt,
    _active: p.active,
  }))
)

const photosWithBgRemoval = computed(() =>
  mergedPhotos.value.filter(photo => photo._raw.removeBg)
)

const photosWithDecor = computed(() =>
  mergedPhotos.value.filter(photo => !photo._raw.removeBg)
)

const photosWithBgRemovalFiltered = computed(() => {
  const q = (adminSearch.value || '').trim().toLowerCase()
  if (!q) return photosWithBgRemoval.value
  return photosWithBgRemoval.value.filter(p => {
    if ((p._displayAlt || '').toLowerCase().includes(q)) return true
    const tags = p._raw.tags
    if (Array.isArray(tags)) return tags.some(t => (t||'').toLowerCase().includes(q))
    if (typeof tags === 'string') return tags.toLowerCase().includes(q)
    return false
  })
})

const photosWithDecorFiltered = computed(() => {
  const q = (adminSearch.value || '').trim().toLowerCase()
  if (!q) return photosWithDecor.value
  return photosWithDecor.value.filter(p => {
    if ((p._displayAlt || '').toLowerCase().includes(q)) return true
    const tags = p._raw.tags
    if (Array.isArray(tags)) return tags.some(t => (t||'').toLowerCase().includes(q))
    if (typeof tags === 'string') return tags.toLowerCase().includes(q)
    return false
  })
})

// Upload (Firebase Storage)
const fileInput = ref(null)
const upload = ref({ gallery: 'gallery', files: [], previews: [], alts: [], uploading: false, done: false, error: '' })

const onFileChange = (e) => {
   const files = Array.from(e.target.files)
   if (!files.length) return
   upload.value.files = files
   upload.value.previews = files.map(f => URL.createObjectURL(f))
   upload.value.alts = files.map(f => f.name.replace(/\.[^/.]+$/, ''))
   upload.value.done = false
   upload.value.error = ''
 }

const uploadPhoto = async () => {
   if (!upload.value.files.length || upload.value.alts.some(a => !a.trim())) return
   upload.value.uploading = true
   upload.value.error = ''
   try {
     for (let i = 0; i < upload.value.files.length; i++) {
       const file = upload.value.files[i]
       const ext = file.name.split('.').pop()
       const fileName = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
       const snapshot = await uploadBytes(storageRef(storage, fileName), file)
       const url = await getDownloadURL(snapshot.ref)
       await addDoc(collection(db, 'photos'), {
         url,
         gallery: upload.value.gallery,
         alt: upload.value.alts[i],
         active: true,
         removeBg: false,
         createdAt: new Date().toISOString(),
       })
     }
      upload.value.done = true
      setTimeout(() => { upload.value.done = false }, 4000)
      upload.value.files = []
      upload.value.previews = []
      upload.value.alts = []
      if (fileInput.value) fileInput.value.value = ''
    } catch (e) {
      upload.value.error = 'Erreur lors de l\'envoi vers Firebase Storage.'
      console.error('upload error', e)
    }
    upload.value.uploading = false
  }

  const toggleDynamicPhoto = async (photo) => {
  await setDoc(doc(db, 'photos', photo.id), { ...photo, active: !photo.active })
}

const toggleRemoveBg = async (photo) => {
  await setDoc(doc(db, 'photos', photo.id), { ...photo, removeBg: !photo.removeBg })
}

const deleteDynamicPhoto = async (photo) => {
  if (!confirm(`Supprimer "${photo.alt}" ?`)) return
  upload.value.done = false
  await deleteDoc(doc(db, 'photos', photo.id))
}

const deleteAllDynamicPhotos = async () => {
  if (!confirm('⚠️ Supprimer TOUTES les photos ? Cette action est irréversible.')) return
  const snap = await getDocs(collection(db, 'photos'))
  const deletions = snap.docs.map(d => deleteDoc(doc(db, 'photos', d.id)))
  await Promise.all(deletions)
}

const deleteStaticPhoto = async (photoId) => {
  if (!confirm('Supprimer cette photo statique ? Elle pourra être restaurée plus tard.')) return
  if (!galleriesState.value._deleted) galleriesState.value._deleted = {}
  galleriesState.value._deleted[photoId] = true
  await setDoc(doc(db, 'config', 'galleries'), galleriesState.value)
}

const restoreStaticPhoto = async (photoId) => {
  if (!galleriesState.value._deleted) return
  delete galleriesState.value._deleted[photoId]
  await setDoc(doc(db, 'config', 'galleries'), galleriesState.value)
}

const loadDynamicPhotos = () => {
  onSnapshot(
    query(collection(db, 'photos'), orderBy('createdAt')),
    snap => { dynamicPhotos.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    err => { console.warn('Firestore photos error:', err) }
  )
}

const saveDynamicPhotoAlt = async (photo, alt) => {
  await setDoc(doc(db, 'photos', photo.id), { ...photo, alt })
}

// Auth
onAuthStateChanged(auth, async (u) => {
  user.value = u
  if (u) {
    await checkAdmin(u.email)
    if (isAdmin.value) loadData()
  }
})

const checkAdmin = async (email) => {
  // Vérifier dans Firestore d'abord, puis dans la liste locale
  try {
    const snap = await getDocs(collection(db, 'admins'))
    const emails = snap.docs.map(d => d.data().email)
    isAdmin.value = emails.includes(email) || ADMIN_EMAILS.includes(email)
  } catch {
    isAdmin.value = ADMIN_EMAILS.includes(email)
  }
}

// Au chargement, récupère le résultat si on revient d'une redirection
onMounted(() => {
  getRedirectResult(auth).catch(() => {})
})

const login = async () => {
  loading.value = true
  error.value = ''
  try {
    await signInWithPopup(auth, googleProvider)
  } catch (e) {
    // Safari bloque les popups — on guide l'utilisateur
    error.value = 'Popup bloquée. Vérifiez les paramètres de Safari ou utilisez Chrome/Firefox.'
  }
  loading.value = false
}

const logout = () => signOut(auth)

const switchAccount = async () => {
  await signOut(auth)
  loading.value = true
  error.value = ''
  try {
    await signInWithPopup(auth, googleProvider)
  } catch (e) {
    error.value = 'Popup bloquée. Vérifiez les paramètres de Safari ou utilisez Chrome/Firefox.'
  }
  loading.value = false
}

// Fermetures
const loadClosures = () => {
  onSnapshot(query(collection(db, 'fermetures'), orderBy('date')), snap => {
    closures.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

const addClosure = async () => {
  if (!newClosure.value.date) return
  await addDoc(collection(db, 'fermetures'), {
    date: newClosure.value.date,
    label: newClosure.value.label || 'Fermeture exceptionnelle'
  })
  newClosure.value = { date: '', label: '' }
}

const deleteClosure = async (id) => {
  await deleteDoc(doc(db, 'fermetures', id))
}

const onPreviewDateClick = (date) => {
  if (date.closed) {
    const closure = closures.value.find(c => c.date === date.iso)
    if (closure && confirm(`Annuler la fermeture du ${date.label} ?`)) {
      deleteClosure(closure.id)
    }
  } else {
    newClosure.value.date = date.iso
    newClosure.value.label = 'Fermeture exceptionnelle'
    document.querySelector('.input-date')?.focus()
  }
}

// Édition inline du motif de fermeture
const editingClosure = ref(null)
const editingClosureLabel = ref('')
const startEditClosure = (c) => {
  editingClosure.value = c.id
  editingClosureLabel.value = c.label || 'Fermeture exceptionnelle'
}
const saveClosureLabel = async (c) => {
  await setDoc(doc(db, 'fermetures', c.id), { date: c.date, label: editingClosureLabel.value })
  editingClosure.value = null
}

const formatDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Calcul aperçu calendrier (même logique que Calendar.vue)
// -- APERÇU CALENDRIER (admin) --------------------------------------------
function nthWeekdayOfMonth(year, month, weekday, n) {
  const first = new Date(year, month, 1)
  const diff = (weekday - first.getDay() + 7) % 7
  const day = 1 + diff + (n - 1) * 7
  return new Date(year, month, day)
}

function getOpeningDatesFromRegles(regles, monthsAhead = 3) {
  const dates = []
  const today = new Date(); today.setHours(0,0,0,0)
  const end = new Date(today); end.setMonth(end.getMonth() + monthsAhead)
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1)
  while (cursor <= end) {
    for (const regle of regles) {
      const jourNum = typeof regle.jour === 'number' ? regle.jour : parseInt(regle.jour)
      for (const occ of (regle.semaines || [1, 3])) {
        const date = nthWeekdayOfMonth(cursor.getFullYear(), cursor.getMonth(), jourNum, occ)
        if (date >= today && date <= end) dates.push({ date, label_jour: regle.label || 'ouverture', color: regle.color || '#1BA9A8' })
      }
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return dates.sort((a, b) => a.date - b.date)
}

const calPreview = computed(() => {
  return getOpeningDatesFromRegles(horairesRegles.value).slice(0, 8).map(item => {
    const { date, label_jour, color } = item
    const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    return {
      iso,
      label_jour,
      color,
      day: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  })
})

const previewDates = computed(() => {
  const closedMap = {}
  closures.value.forEach(c => { closedMap[c.date] = c.label || 'Fermeture exceptionnelle' })
  return getOpeningDatesFromRegles(horairesRegles.value, 3).slice(0, 10).map(({ date, label_jour }) => {
    const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    return {
      iso,
      closed: !!closedMap[iso],
      closureLabel: closedMap[iso] || '',
      weekday: label_jour,
      day: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  })
})

// Actualités
const loadActu = () => {
  onSnapshot(doc(db, 'config', 'actualite'), snap => {
    if (snap.exists()) Object.assign(actu.value, snap.data())
  })
}

const saveActu = async () => {
  await setDoc(doc(db, 'config', 'actualite'), { ...actu.value })
  actuSaved.value = true
  setTimeout(() => actuSaved.value = false, 2000)
}

// Textes — remplacé par loadTextes défini dans la section blocs ci-dessus

// Admins
const loadAdmins = () => {
  onSnapshot(collection(db, 'admins'), snap => {
    adminList.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

const addAdmin = async () => {
  if (!newAdminEmail.value) return
  await addDoc(collection(db, 'admins'), { email: newAdminEmail.value })
  newAdminEmail.value = ''
}

const deleteAdmin = async (id) => {
  await deleteDoc(doc(db, 'admins', id))
}

// -- PALETTE COULEURS SUGGÉRÉES ------------------------------------------
const COLOR_PALETTE = [
  '#1BA9A8', // teal
  '#E95E5E', // coral
  '#F5E6D3', // beige
  '#8B6F47', // marron
  '#FFFFFF', // blanc
  '#333333', // gris foncé
  '#FF6B6B', // corail vif
  '#4ECDC4', // turquoise
  '#FFE66D', // jaune doux
  '#2C3E50', // bleu nuit
]

const applyColor = (fieldId, color) => {
  textesValues.value[fieldId] = color
}
 const applyRegleColor = (regle, color) => {
   regle.color = color
 }

const DEFAULT_REGLES = [
  { jour: 3, semaines: [1, 3], label: 'mercredi', texte_jours: 'Les 1ers et 3èmes mercredis du mois', color: '#1BA9A8', emoji: '📅' },
  { jour: 6, semaines: [1, 3], label: 'samedi',   texte_jours: 'Les 1ers et 3èmes samedis du mois',  color: '#E95E5E', emoji: '📅' },
]
const horairesRegles   = ref(JSON.parse(JSON.stringify(DEFAULT_REGLES)))
const horairesPlageTxt = ref('10h00 – 17h30 sans interruption')
  const horairesBenevoles = ref('')
const horairesTitreCalendrier = ref("Calendrier d'ouverture")
const horairesTitreSection    = ref("Horaires d'ouverture")
const horairesSaved    = ref(false)

const JOURS_OPTIONS = [
  { num: 1, label: 'Lundi' },
  { num: 2, label: 'Mardi' },
  { num: 3, label: 'Mercredi' },
  { num: 4, label: 'Jeudi' },
  { num: 5, label: 'Vendredi' },
  { num: 6, label: 'Samedi' },
  { num: 0, label: 'Dimanche' },
]
const SEMAINES_OPTIONS = [
  { num: 1, label: '1ère' },
  { num: 2, label: '2ème' },
  { num: 3, label: '3ème' },
  { num: 4, label: '4ème' },
  { num: 5, label: '5ème' },
]

const loadHoraires = () => {
  onSnapshot(doc(db, 'config', 'horaires'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.regles && d.regles.length) horairesRegles.value = d.regles
    if (d.plage)      horairesPlageTxt.value = d.plage
    if (d.benevoles)  horairesBenevoles.value = d.benevoles
    if (d.titre_calendrier) horairesTitreCalendrier.value = d.titre_calendrier
    if (d.horaires_titre)   horairesTitreSection.value   = d.horaires_titre
  }, () => {})
}

const addRegle = () => {
  horairesRegles.value.push({ jour: 3, semaines: [1, 3], label: 'mercredi', texte_jours: '1ers et 3èmes mercredis' })
}

const removeRegle = (i) => {
  horairesRegles.value.splice(i, 1)
}

const toggleSemaine = (regle, n) => {
  const idx = regle.semaines.indexOf(n)
  if (idx === -1) regle.semaines.push(n)
  else regle.semaines.splice(idx, 1)
  regle.semaines.sort((a, b) => a - b)
}

const updateRegleJour = (regle, jourNum) => {
  regle.jour = parseInt(jourNum)
  const found = JOURS_OPTIONS.find(j => j.num === regle.jour)
  if (found) regle.label = found.label.toLowerCase()
  // Couleur par défaut selon le jour
  const colorMap = { 3: '#1BA9A8', 6: '#E95E5E' }
  regle.color = colorMap[regle.jour] || '#1BA9A8'
}

const saveHoraires = async () => {
  await setDoc(doc(db, 'config', 'horaires'), {
    regles: horairesRegles.value,
    plage: horairesPlageTxt.value,
    benevoles: horairesBenevoles.value,
    titre_calendrier: horairesTitreCalendrier.value,
    horaires_titre: horairesTitreSection.value,
  })
  horairesSaved.value = true
  setTimeout(() => horairesSaved.value = false, 2000)
}

const loadData = () => {
  loadClosures()
  loadActu()
  loadTextes()
  loadAdmins()
  loadDynamicPhotos()
  loadBlocs()
  loadHoraires()
}
</script>

<style scoped>
.admin-wrapper {
  min-height: 100vh;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}

/* LOGIN */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1BA9A8 0%, #F5E6D3 100%);
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.login-logo { font-size: 3em; margin-bottom: 10px; }
.login-card h1 { color: #1BA9A8; margin-bottom: 6px; font-size: 1.4em; }
.login-card p { color: #666; margin-bottom: 24px; font-size: 0.9em; }

.btn-google { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-denied-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  border: 2px solid #E95E5E;
  border-radius: 8px;
  background: white;
  color: #E95E5E;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-denied-logout:hover { background: #fff0f0; }
.btn-google:hover { border-color: #1BA9A8; background: #f0fafa; }
.btn-google img { width: 20px; height: 20px; }
/* Mentions editor styles */
.mentions-editor-block { border: 1px solid #e6e6e6; border-radius: 8px; padding: 8px }
.mentions-toolbar { display:flex; gap:8px; margin-bottom:8px }
.mentions-toolbar button { padding:6px 8px; border-radius:6px; border:1px solid #ddd; background:white; cursor:pointer }
.mentions-editor { min-height:120px; padding:8px; border-radius:6px; background:white; outline:none }
.mentions-help { font-size:0.85em; color:#666; margin-top:6px }

/* recognition admin */
.recognition-admin-item { border:1px solid #eee; padding:10px; border-radius:8px; margin-bottom:10px }
.recognition-row { display:flex; gap:8px }
.recognition-preview img { display:block }

.login-error { color: #E95E5E; margin-top: 12px; font-size: 0.85em; }

/* LAYOUT */
.admin-layout { display: flex; flex-direction: column; min-height: 100vh; }

.admin-header {
  background: #1BA9A8;
  color: white;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.admin-header h1 { font-size: 1.1em; margin: 0; color: white; }

.admin-user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9em;
}
.user-avatar { width: 32px; height: 32px; border-radius: 50%; }

.btn-logout {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.4);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.2s;
}
.btn-logout:hover { background: rgba(255,255,255,0.35); }
.btn-switch-account {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.82em;
  transition: background 0.2s;
  white-space: nowrap;
}
.btn-switch-account:hover { background: rgba(255,255,255,0.25); }

.admin-nav {
  background: white;
  border-bottom: 2px solid #eee;
  display: flex;
  gap: 0;
  overflow-x: auto;
}
.admin-nav button {
  padding: 14px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9em;
  color: #666;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
  transition: all 0.2s;
}
.admin-nav button.active { color: #1BA9A8; border-bottom-color: #1BA9A8; font-weight: 600; }
.admin-nav button:hover { background: #f5f5f5; }

.admin-main {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px 20px;
  width: 100%;
}

.admin-main h2 { color: #1BA9A8; margin-bottom: 6px; }
.section-desc { color: #888; font-size: 0.88em; margin-bottom: 20px; }

/* FORMULAIRES */
.form-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.form-block { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.form-block label { font-weight: 600; font-size: 0.9em; color: #444; }

.input-date, .input-text, .input-textarea, .input-select {
  /* Compact, consistent inputs across the admin panel (match thumbnail editors) */
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.82em;
  line-height: 1.2;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.input-search { padding:6px 8px; border:1px solid #ddd; border-radius:6px; font-size:0.82em; line-height:1.2 }
.search-field { position:relative; display:inline-flex; align-items:center }
.search-field .input-search { padding-right: 34px }
.search-clear { position:absolute; right:8px; background:transparent; border:none; font-size:14px; cursor:pointer; color:#888 }
.input-search::-webkit-search-cancel-button,
.input-search::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}
.input-search::-ms-clear,
.input-search::-ms-reveal { display:none; width:0; height:0 }
.thumb-tags { margin-top:6px }
.thumb-tag-input {
  /* More compact than .input-text so content fits in small thumbnail editors */
  width: 100%;
  box-sizing: border-box;
  font-size: 0.82em;
  line-height: 1.2;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.thumb-tag-input:focus { border-color: #1BA9A8; outline: none }
.input-date:focus, .input-text:focus, .input-textarea:focus, .input-select:focus {
  outline: none;
  border-color: #1BA9A8;
}
.input-text { flex: 1; min-width: 180px; }
.input-text.full { width: 100%; }
.input-textarea { resize: vertical; }

.checkbox-label { display: flex; align-items: center; gap: 8px; font-weight: normal !important; cursor: pointer; }

.btn-add {
  background: #1BA9A8;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: background 0.2s;
}
.btn-add:hover { background: #158886; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-save {
  background: #1BA9A8;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  align-self: flex-start;
  transition: background 0.2s;
}
.btn-save:hover { background: #158886; }

.saved-msg { color: #4CAF50; font-size: 0.9em; align-self: center; }

/* LISTE */
.list { display: flex; flex-direction: column; gap: 8px; }
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 2px solid #eee;
  border-radius: 10px;
  padding: 12px 16px;
}
.item-date { font-weight: 700; color: #1BA9A8; font-size: 0.9em; white-space: nowrap; }
.item-label { flex: 1; color: #444; font-size: 0.9em; cursor: pointer; }
.item-label:hover { color: #1BA9A8; }
.item-label-edit { flex: 1; display: flex; align-items: center; gap: 6px; }

.btn-delete {
  background: none;
  border: none;
  color: #E95E5E;
  cursor: pointer;
  font-size: 1.1em;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.btn-delete:hover { background: #fff0f0; }
.btn-delete:disabled { opacity: 0.3; cursor: not-allowed; }

.empty { color: #aaa; font-style: italic; font-size: 0.9em; }

/* Valeurs actuelles */
.current-value {
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 4px;
}
.current-value-label {
  display: block;
  font-size: 0.75em;
  color: #999;
  margin-bottom: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.current-value-text {
  font-size: 0.88em;
  color: #555;
  line-height: 1.5;
}
.field-hint {
  font-size: 0.78em;
  color: #bbb;
  font-style: italic;
}

/* GALERIES */
.gallery-section {
  margin-bottom: 36px;
  background: white;
  border: 2px solid #eee;
  border-radius: 12px;
  padding: 20px;
}
.gallery-section h3 {
  color: #1BA9A8;
  margin-bottom: 4px;
  font-size: 1em;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.gallery-thumb {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #eee;
  transition: border-color 0.2s, opacity 0.2s;
  cursor: pointer;
}
.gallery-thumb img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  display: block;
}
.gallery-thumb.inactive {
  opacity: 0.4;
  border-color: #ddd;
}
.thumb-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 110px;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.gallery-thumb:hover .thumb-overlay {
  opacity: 1;
  pointer-events: auto;
}
.gallery-thumb.inactive .thumb-overlay {
  opacity: 1;
  background: rgba(0,0,0,0.25);
  pointer-events: auto;
}
.toggle-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: white;
  font-size: 0.78em;
  font-weight: 700;
}
.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #1BA9A8;
}
.thumb-name {
  font-size: 0.72em;
  color: #666;
  text-align: center;
  padding: 4px 4px 6px;
  margin: 0;
  background: #fafafa;
  border-top: 1px solid #eee;
  line-height: 1.3;
}
.thumb-edit-alt {
  padding: 4px;
  background: #fafafa;
  border-top: 1px solid #eee;
}
.thumb-alt-input {
  /* More compact than .input-text so content fits in small thumbnail editors */
  width: 100%;
  box-sizing: border-box;
  font-size: 0.82em;
  line-height: 1.2;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.thumb-alt-input:focus { border-color: #1BA9A8; outline: none }

/* UPLOAD */
.upload-block {
  background: #f0fafa;
  border: 2px solid #1BA9A8;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 28px;
}
.upload-block h3 {
  color: #1BA9A8;
  margin-bottom: 10px;
  font-size: 1em;
}
.upload-tip {
  background: #fffbe6;
  border: 1px solid #f0d060;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.85em;
  color: #6b5a00;
  line-height: 1.5;
}
.upload-tip a {
  color: #1BA9A8;
  font-weight: 700;
}
.input-file {
  font-size: 0.88em;
  color: #444;
}
 .upload-preview {
   display: flex;
   gap: 8px;
   flex-wrap: wrap;
   margin-bottom: 8px;
 }
 .upload-preview img {
   width: 120px;
   height: 120px;
   border-radius: 10px;
   overflow: hidden;
   border: 2px solid #1BA9A8;
    object-fit: cover;
  }
 .error-msg {
  color: #E95E5E;
  font-size: 0.88em;
}
.thumb-delete {
  background: rgba(233,94,94,0.85);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
  transition: background 0.2s;
}
.thumb-delete:hover { background: #c03030; }
.thumb-bg-toggle {
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 6px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  margin-top: 4px;
  transition: all 0.2s;
}
.thumb-bg-toggle.active {
  background: rgba(27,169,168,0.7);
  border-color: #1BA9A8;
}
.thumb-bg-toggle:hover { background: rgba(255,255,255,0.35); }
.thumb-restore {
  background: rgba(27,169,168,0.85);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  color: white;
}
.thumb-restore:hover { background: #158886; }
.dynamic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 4px;
  grid-column: 1 / -1;
}
.dynamic-count {
  font-size: 0.82em;
  color: #888;
  font-weight: 600;
}
.btn-delete-all {
  background: none;
  border: 2px solid #E95E5E;
  color: #E95E5E;
  padding: 4px 14px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 0.82em;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-delete-all:hover { background: #E95E5E; color: white; }
.btn-delete-all:disabled { opacity: 0.4; cursor: not-allowed; }
.gallery-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-migrate {
  background: none;
  border: 2px solid #1BA9A8;
  color: #1BA9A8;
  padding: 4px 14px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 0.82em;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-migrate:hover { background: #1BA9A8; color: white; }
.btn-migrate:disabled { opacity: 0.4; cursor: not-allowed; }
.gallery-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}
.gallery-section-header h3 {
  margin-bottom: 0 !important;
}
.thumb-edit-alt {
  position: relative;
}
.alt-saved {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  color: #4CAF50;
  font-size: 0.85em;
  font-weight: 700;
  pointer-events: none;
}
.photo-count {
  font-weight: 400;
  font-size: 0.75em;
  color: #888;
}
.badge-static {
  background: #1BA9A8 !important;
}
.badge-cloud {
  background: #E95E5E !important;
}
.deleted-section {
  margin-top: 28px;
  padding: 16px;
  background: #fff8f0;
  border: 2px dashed #e0a060;
  border-radius: 10px;
}
.deleted-section h4 {
  color: #a06830;
  margin: 0 0 4px 0;
  font-size: 0.95em;
}
.thumb-deleted-label {
  display: block;
  font-size: 0.75em;
  color: #999;
  text-align: center;
  padding: 4px;
}
 .upload-previews {
   display: flex;
   flex-direction: column;
   gap: 10px;
   margin-bottom: 10px;
   max-height: 400px;
   overflow-y: auto;
   padding: 10px;
   border: 1px solid #eee;
   border-radius: 8px;
 }
 .upload-preview-item {
   display: flex;
   align-items: center;
   gap: 10px;
   width: 100%;
 }
  .upload-preview-item img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid #1BA9A8;
    flex-shrink: 0;
  }
  .upload-alt-input {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.82em;
    line-height: 1.2;
  }

.thumb-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  color: white;
  border-radius: 6px;
  font-size: 0.75em;
  padding: 2px 6px;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
}

/* Aperçu calendrier */
.preview-block {
  margin-top: 28px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 18px;
}
.preview-block h3 {
  font-size: 0.9em;
  color: #888;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.preview-calendar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}
.preview-date {
  background: white;
  border-radius: 8px;
  padding: 10px 12px;
  border-left: 4px solid #ccc;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: transform 0.1s, box-shadow 0.1s;
}
.preview-clickable {
  cursor: pointer;
}
.preview-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(27,169,168,0.18);
}
.preview-date.closed {
  cursor: pointer;
}
.preview-date.closed:hover {
  opacity: 0.75;
}
.preview-add-tag {
  font-size: 0.7em;
  color: #1BA9A8;
  font-style: italic;
  margin-top: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.preview-clickable:hover .preview-add-tag {
  opacity: 1;
}
.preview-date.mercredi { border-left-color: #1BA9A8; }
.preview-date.samedi { border-left-color: #E95E5E; }
.preview-date.closed {
  opacity: 0.5;
  background: #fff5f5;
  border-left-color: #ccc !important;
}
.preview-day {
  font-size: 0.75em;
  font-weight: 700;
  text-transform: capitalize;
  color: #555;
}
.preview-date.mercredi .preview-day { color: #1BA9A8; }
.preview-date.samedi .preview-day { color: #E95E5E; }
.preview-date.closed .preview-day { text-decoration: line-through; color: #aaa; }
.preview-label {
  font-size: 0.82em;
  color: #333;
}
.preview-date.closed .preview-label { text-decoration: line-through; color: #aaa; }
.preview-closed-tag {
  font-size: 0.72em;
  color: #E95E5E;
  font-style: italic;
}

/* HEADER ADMIN */
.admin-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.btn-preview-site {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}
.btn-preview-site:hover { background: rgba(255,255,255,0.32); text-decoration: none; }
.btn-preview-toggle {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
}
.btn-preview-toggle:hover { background: rgba(255,255,255,0.32); }

/* PREVIEW IFRAME */
.preview-panel {
  border-bottom: 3px solid #1BA9A8;
  background: #111;
  display: flex;
  flex-direction: column;
}
.preview-panel-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: #222;
  color: #ccc;
  font-size: 0.85em;
}
.preview-panel-bar span { flex: 1; }
.btn-refresh, .btn-close-preview {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #ccc;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.2s;
}
.btn-refresh:hover, .btn-close-preview:hover { background: rgba(255,255,255,0.2); }
.preview-iframe {
  width: 100%;
  height: 60vh;
  border: none;
  background: white;
}

/* DÉGRADÉ HERO */
.gradient-editor {
  background: #f8fefe;
  border: 1px solid #c5e8e8;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}
.gradient-label {
  font-weight: 600;
  font-size: 0.88em;
  color: #444;
  display: block;
  margin-bottom: 10px;
}
.gradient-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.preset-swatch {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 2px solid rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.preset-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}
.gradient-preview {
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85em;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

/* COLOR INPUT */
.color-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.input-color {
  width: 44px;
  height: 36px;
  border-radius: 6px;
  border: 2px solid #ddd;
  padding: 2px;
  cursor: pointer;
  background: none;
}

/* INLINE TOGGLE (boutons) */
.inline-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal !important;
}
.inline-toggle input[type="checkbox"] { display: none; }

/* RÉORDONNER BLOCS */
.bloc-reorder {
  display: flex;
  gap: 2px;
}
.reorder-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 5px;
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 0.85em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  color: #555;
}
.reorder-btn:hover:not(:disabled) { background: #1BA9A8; color: white; border-color: #1BA9A8; }
.reorder-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* -- PALETTE COULEURS SUGGÉRÉES -------------------------------------------- */
.color-palette {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: 10px;
  align-items: center;
}
.palette-swatch {
  width: 36px;
  height: 36px;
  border: 2px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s, border-color 0.1s;
}
.palette-swatch:hover {
  transform: scale(1.2);
  border-color: #1BA9A8;
}

/* -- ÉDITEUR HORAIRES ------------------------------------------------------ */
.horaires-intro {
  color: #666; font-size: 0.9em; margin-bottom: 16px; line-height: 1.5;
}
.regle-bloc {
  background: #f9fafb;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.regle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.regle-header strong { color: #1BA9A8; font-size: 0.95em; }
.btn-remove-regle {
  background: none;
  border: 1px solid #E95E5E;
  color: #E95E5E;
  border-radius: 50%;
  width: 24px; height: 24px;
  cursor: pointer;
  font-size: 0.8em;
  line-height: 1;
  display: flex; align-items: center; justify-content: center;
}
.btn-remove-regle:hover { background: #fff0f0; }
.regle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.regle-row label { font-size: 0.85em; color: #555; min-width: 80px; }
.regle-select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 0.9em;
  background: white;
}
.semaines-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.semaine-btn {
  border: 2px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #555;
  padding: 4px 10px;
  font-size: 0.82em;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s;
}
.semaine-btn.active {
  border-color: #1BA9A8;
  background: #1BA9A8;
  color: white;
}
.btn-add-regle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 8px 14px;
  border: 2px dashed #1BA9A8;
  border-radius: 8px;
  background: none;
  color: #1BA9A8;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add-regle:hover { background: #f0fafa; }

/* -- APERÇU CALENDRIER ---------------------------------------------------- */
.cal-preview {
  margin-top: 20px;
  padding: 14px;
  background: #f9fafb;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
}
.cal-preview h4 { color: #1BA9A8; font-size: 0.9em; margin-bottom: 10px; }
.cal-preview-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.cal-preview-item {
  background: white;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.82em;
  border-left: 3px solid #1BA9A8;
  display: flex; flex-direction: column; gap: 2px;
}
.cal-preview-item.mercredi { border-left-color: #1BA9A8; }
.cal-preview-item.samedi   { border-left-color: #E95E5E; }
.cal-day { font-weight: 700; text-transform: capitalize; color: #1BA9A8; font-size: 0.85em; }
.cal-preview-item.samedi .cal-day { color: #E95E5E; }
.cal-date { color: #444; }

/* -- LISTES ÉDITABLES (products) ------------------------------------------- */
.items-list { display: flex; flex-direction: column; gap: 6px; }
.items-row { display: flex; align-items: center; gap: 8px; }

/* DRAG & DROP */
.site-bloc.dragging { opacity: 0.4; }
.site-bloc.drag-over { border-color: #1BA9A8; box-shadow: 0 0 0 2px #1BA9A8; }
.site-bloc.bloc-fixed { cursor: default; }
.site-bloc.bloc-fixed .bloc-header { cursor: pointer; }
.site-bloc {
  background: white;
  border: 2px solid #eee;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.site-bloc:hover { border-color: #c5e8e8; }

.bloc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: pointer;
  user-select: none;
  gap: 12px;
}
.bloc-header:hover { background: #f8fefe; }

.bloc-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.bloc-icon {
  font-size: 1.4em;
  flex-shrink: 0;
}
.bloc-title {
  display: block;
  font-size: 0.95em;
  color: #222;
}
.bloc-desc {
  display: block;
  font-size: 0.78em;
  color: #999;
  margin-top: 2px;
}

.bloc-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.bloc-chevron {
  font-size: 0.75em;
  color: #aaa;
}

/* Toggle switch */
.visibility-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}
.visibility-toggle input[type="checkbox"] { display: none; }
.toggle-track {
  width: 38px;
  height: 22px;
  background: #ddd;
  border-radius: 11px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.visibility-toggle input:checked + .toggle-track { background: #1BA9A8; }
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.visibility-toggle input:checked + .toggle-track .toggle-thumb { left: 19px; }
.toggle-text {
  font-size: 0.8em;
  color: #666;
  white-space: nowrap;
}

/* Nav toggle (smaller) */
.nav-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
.nav-toggle input[type="checkbox"] { display: none; }
.toggle-track.sm {
  width: 30px;
  height: 18px;
}
.toggle-track.sm .toggle-thumb {
  width: 12px;
  height: 12px;
  top: 3px;
  left: 3px;
}
.nav-toggle input:checked + .toggle-track { background: #1BA9A8; }
.nav-toggle input:checked + .toggle-track .toggle-thumb { left: 15px; }
.nav-toggle .toggle-text {
  font-size: 0.75em;
  min-width: 2em;
}

.bloc-body {
  border-top: 1px solid #f0f0f0;
  padding: 18px;
  background: #fafafa;
}
.bloc-no-fields { padding: 12px 18px; }

.bloc-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}
</style>
