(() => {
  const records = window.ARCHIVE_RECORDS;
  const worlds = {
    moon: {title:'LUNAR SURFACE · ELEVATION ATLAS', layer:'LRO WAC + LOLA DEM · NASA TREK', scale:'LOLA İZOHİPS · KÜRESEL YÜKSEKLİK', contours:64, majorEvery:8, relief:.023, colorRange:[.18,.72], contourColor:[.98,.93,.82], majorColor:[1,.98,.9], height:'moon-height.png', image:'moon-color.jpg', tiles:'Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02', oldest:'1962', oldestName:'Ranger 4 · çarpma', last:'2014'},
    mars: {title:'MARTIAN SURFACE · ELEVATION ATLAS', layer:'VIKING MOSAIC + MOLA DEM · NASA TREK', scale:'MOLA İZOHİPS · KÜRESEL YÜKSEKLİK', contours:64, majorEvery:8, relief:.038, colorRange:[-.02,.84], contourColor:[1,.83,.66], majorColor:[1,.93,.8], height:'mars-height.png', image:'mars-color.jpg', tiles:'Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m', oldest:'1976', oldestName:'Viking 1 · iniş', last:'2021'}
  };
  const landmarks = {
    moon: [
      {name:'OCEANUS PROCELLARUM', lat:18.4, lon:-57.4}, {name:'MARE IMBRIUM', lat:32.8, lon:-15.6},
      {name:'COPERNICUS', lat:9.6, lon:-20.1}, {name:'TYCHO', lat:-43.3, lon:-11.2},
      {name:'MARE TRANQUILLITATIS', lat:.68, lon:23.43}, {name:'MARE SERENITATIS', lat:28, lon:17.5},
      {name:'ARISTARCHUS', lat:23.7, lon:-47.4}
    ],
    mars: [
      {name:'OLYMPUS MONS', lat:18.65, lon:-133.8}, {name:'VALLES MARINERIS', lat:-13, lon:-59},
      {name:'HELLAS PLANITIA', lat:-42, lon:70}, {name:'GALE CRATER', lat:-5.4, lon:137.8},
      {name:'JEZERO CRATER', lat:18.4, lon:77.7}, {name:'ELYSIUM MONS', lat:25, lon:147}
    ]
  };
  const $ = selector => document.querySelector(selector);
  const i18n = {
    tr:{archive:'ARŞİV',viewOrientation:'GÖRÜŞ YÖNÜ',dataVia:'VERİ KAYNAĞI',coordinateNote:'KOORDİNATLAR KAYNAKTAKİ KESİNLİKLE SUNULUR',search:'Görev veya araç ara',records:'KAYITLAR',selected:'SEÇİLİ KAYIT',year:'GÖREV YILI',status:'GÖREV DURUMU',coords:'ENLEM / BOYLAM',type:'KAYIT TÜRÜ',confidence:'KONUM GÜVENİ',source:'KAYNAĞI AÇ',noResults:'Eşleşen kayıt yok',noResultsHint:'Aramayı veya filtreyi değiştir.',faal:'FAAL',inactive:'FAAL DEĞİL',destination:'HEDEF',moon:'AY',mars:'MARS',crew:'AY YÜZEYİNDE YÜRÜYENLER',landing:'İNİŞ SAHASI',missionResult:'GÖREV SONUCU',landed:'AY’A İNİŞ',mission:'GÖREV',missionType:'AY GÖREVİ'},
    en:{archive:'ARCHIVE',viewOrientation:'VIEW ORIENTATION',dataVia:'DATA VIA',coordinateNote:'COORDINATES SHOWN AT SOURCE CONFIDENCE',search:'Search missions or equipment',records:'RECORDS',selected:'SELECTED RECORD',year:'MISSION YEAR',status:'MISSION STATUS',coords:'LATITUDE / LONGITUDE',type:'RECORD TYPE',confidence:'LOCATION CONFIDENCE',source:'OPEN SOURCE',noResults:'No matching records',noResultsHint:'Change the search or filter.',faal:'ACTIVE',inactive:'INACTIVE',destination:'DESTINATION',moon:'MOON',mars:'MARS',crew:'MOONWALKERS',landing:'LANDING SITE',missionResult:'MISSION RESULT',landed:'LANDED',mission:'MISSION',missionType:'LUNAR CREW'}
  };
  let language=localStorage.getItem('oa-language-v2')==='tr'?'tr':'en';
  const tr = key => i18n[language][key] || i18n.tr[key] || key;
  const modelViewerSrc='https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js';
  const mediaCache=new Map();
  let modelViewerPromise=null;
  const normalizeLon = lon => ((lon + 180) % 360 + 360) % 360 - 180;
  let world = 'moon', filter = 'all', selected = null, map = null, drag = null;
  const list = $('#record-list');
  function applyLanguage() {
    document.documentElement.lang=language;
    $('#boot-screen').setAttribute('aria-label',language==='tr'?'Offworld Archive yükleniyor':'Loading Offworld Archive');
    $('#language-toggle').innerHTML=language==='tr'?'TR <i>/</i> EN':'EN <i>/</i> TR';
    document.querySelectorAll('[data-i18n]').forEach(node=>node.textContent=tr(node.dataset.i18n));
    $('#search').placeholder=tr('search');
    const labels=document.querySelectorAll('.rail .section-label');
    if(labels[1]&&labels[1].firstChild)labels[1].childNodes[0].textContent=`${tr('records')} `;
    const detail=$('.detail-head .section-label');if(detail)detail.textContent=tr('selected');
    const mini=$('.detail-bottom .mini-label');if(mini)mini.textContent=tr('confidence');
    const source=$('#primary-source');if(source)source.firstChild.textContent=`${tr('source')} `;
    const meta=document.querySelectorAll('.meta-item small');
    [tr('year'),tr('status'),tr('coords'),tr('type')].forEach((value,index)=>{if(meta[index])meta[index].textContent=value;});
    document.querySelectorAll('.world-quick-switch .quick-world').forEach((button,index)=>button.textContent=language==='tr'?(index===0?'AY':'MARS'):(index===0?'MOON':'MARS'));
    document.querySelectorAll('.world-option').forEach(button=>{const key=button.dataset.world;button.querySelector('b').textContent=tr(key);button.querySelector('small').textContent=`${key.toUpperCase()} · ${String(records[key].length).padStart(2,'0')} ${language==='tr'?'KAYIT':'RECORDS'}`;});
    const sourceTitle=worlds[world];$('#map-title').textContent=language==='tr'?(world==='moon'?'AY YÜZEYİ · YÜKSELTİ ATLASI':'MARS YÜZEYİ · YÜKSELTİ ATLASI'):sourceTitle.title;
    $('#map-status b').textContent=language==='tr'?'NASA GÖREV KÜRESİ HAZIRLANIYOR':'PREPARING NASA SURFACE GLOBE';
    $('#map-status p').textContent=language==='tr'?'Gerçek yüzey görüntüsü ve yükselti çizgileri yükleniyor.':'Loading real surface imagery and elevation contours.';
    document.querySelectorAll('.filter').forEach(button=>{const labels=language==='tr'?{all:'Tümü',mobile:'Hareketli',lander:'İniş aracı'}:{all:'All',mobile:'Mobile',lander:'Landers'};button.textContent=labels[button.dataset.filter];});
    $('#archive-drawer').setAttribute('aria-label',language==='tr'?'Görev arşivi':'Mission archive');
    $('#map').setAttribute('aria-label',language==='tr'?'NASA yüzey verisiyle etkileşimli Ay veya Mars küresi':'Interactive Moon or Mars globe with NASA surface data');
    $('#mesh-pins').setAttribute('aria-label',language==='tr'?'Görev ve Apollo iniş sahaları':'Mission and Apollo landing sites');
    $('#zoom-out').setAttribute('aria-label',language==='tr'?'Uzaklaş':'Zoom out');$('#zoom-in').setAttribute('aria-label',language==='tr'?'Yakınlaş':'Zoom in');$('#reset-view').setAttribute('aria-label',language==='tr'?'Görünümü sıfırla':'Reset view');
    $('.mini-label').textContent=tr('confidence');
    $('.footer-brand small').textContent=`· ${language==='tr'?'NASA SPACE APPS CHALLENGE 2026':'NASA SPACE APPS CHALLENGE 2026'}`;
  }

  function displayName(record){
    if(language==='tr')return record.nameTr||record.name;
    if(record.nameEn)return record.nameEn;
    return record.name.replace(/İniş aşaması|iniş aşaması/g,'Descent Stage').replace(/yükseliş aşaması/g,'Ascent Stage').replace(/ALSEP bilim paketi/g,'ALSEP Science Package').replace(/S-IVB roket aşaması/g,'S-IVB Rocket Stage').replace(/kütle spektrometresi kolu/g,'Mass Spectrometer Boom').replace(/son görev bölgesi/g,'Final Mission Region').replace(/sabit lander/g,'Stationary Lander').replace(/Ay yürüyüşü ekibi/g,'Moonwalkers');
  }
  function idMissionNumber(id){return String(id?.id??id??'').match(/^apollo-(\d+)/)?.[1]||'00';}
  function displayRegion(record){return language==='tr'?(record.regionTr||record.region):(record.regionEn||record.region.replace('Çarpma yeri belirlenmedi','Impact site undetermined').replace('kesin konum bilinmiyor','exact location unknown').replace('Kesin konum bilinmiyor','Exact location unknown').replace('tahmini çarpma','estimated impact').replace('belirsiz alan','uncertain area'));}
  function displayCoordinates(record){return language==='tr'?(record.coordsTr||record.coords):(record.coordsEn||record.coords.replaceAll('° K','° N').replaceAll('° G','° S').replaceAll('° D','° E').replaceAll('° B','° W').replace('Kesin konum bilinmiyor','Exact location unknown').replace('yaklaşık','approx.'));}
  function displayStory(record){
    if(language==='tr')return record.storyTr||record.story;
    if(record.storyEn)return record.storyEn;
    if(record.id.startsWith('apollo-'))return 'This Apollo artifact marks a lasting trace of the mission. Open the linked NASA record for equipment and site details.';
    return `This NASA mission record documents ${displayName(record)} at ${displayRegion(record)}. See the linked source for mission details and location evidence.`;
  }
  function buildLunarPhaseMarks(){
    const svgNS='http://www.w3.org/2000/svg';
    const sites=[{x:42,y:100},{x:91,y:59},{x:166,y:54},{x:220,y:88},{x:438,y:100},{x:389,y:141},{x:314,y:146},{x:260,y:112}];
    const illumination=[.08,.2,.5,.8,.98,.8,.5,.2];
    document.querySelectorAll('.lunar-phases').forEach(layer=>{
      layer.replaceChildren();
      sites.forEach((site,index)=>{
        const group=document.createElementNS(svgNS,'g');group.setAttribute('class','lunar-phase');group.style.setProperty('--phase-index',index);
        const glow=document.createElementNS(svgNS,'circle');glow.setAttribute('class','phase-glow');glow.setAttribute('cx',site.x);glow.setAttribute('cy',site.y);glow.setAttribute('r','12');group.append(glow);
        for(let dy=-10;dy<=10;dy+=2.4)for(let dx=-10;dx<=10;dx+=2.4){
          const radial=(dx*dx+dy*dy)/(10*10);if(radial>1)continue;
          const edge=Math.sqrt(Math.max(0,1-(dy/10)**2));
          const waxing=index>0&&index<4,waning=index>4&&index<8,edgeX=(1-2*illumination[index])*edge;
          const lit=index===4||(waxing&&dx/10>edgeX)||(waning&&dx/10< -edgeX);
          const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('cx',(site.x+dx).toFixed(2));dot.setAttribute('cy',(site.y+dy).toFixed(2));dot.setAttribute('r',lit?(0.68+(1-radial)*.3).toFixed(2):'.57');dot.setAttribute('class',lit?'moon-dot moon-dot-lit':'moon-dot');group.append(dot);
        }
        layer.append(group);
      });
    });
  }

  function filteredRecords() {
    const query = $('#search').value.trim().toLocaleLowerCase('tr');
    return records[world].filter(record => (filter === 'all' || (filter === 'mobile' ? record.type === 'rover' || record.type === 'aircraft' : filter==='lander' ? record.type==='lander'||record.type==='crew' : record.type === filter))
      && (!query || `${record.name} ${record.nameTr||''} ${record.region} ${record.crew||''} ${record.resource}`.toLocaleLowerCase('tr').includes(query)));
  }

  function renderDetail(record) {
    if (!record) {
      $('#detail-content').innerHTML = `<div class="detail-hero"><div class="detail-title">${tr('noResults')}</div><p class="detail-desc">${tr('noResultsHint')}</p></div>`;
      $('#confidence-value').textContent = '—'; $('#confidence-text').textContent = '';
      $('#primary-source').href = '#'; $('#detail-index').textContent = '—'; return;
    }
    const index = records[world].findIndex(item => item.id === record.id) + 1;
    $('#detail-index').textContent = `${String(index).padStart(2, '0')} / ${String(records[world].length).padStart(2, '0')}`;
    const mobile = record.type === 'rover' || record.type === 'aircraft';
    const type = record.type === 'crew' ? tr('missionType') : record.type === 'aircraft' ? (language==='tr'?'HAVA ARACI':'AIRCRAFT') : mobile ? (language==='tr'?'GEZGİN ARAÇ':'MOBILE VEHICLE') : record.type === 'impactor' ? (language==='tr'?'ÇARPMAYLA BIRAKILAN ARAÇ':'IMPACT / DESCENT HARDWARE') : (language==='tr'?'SABİT İNİŞ / YÜZEY DONANIMI':'STATIONARY LANDER / SURFACE EQUIPMENT');
    const note = mobile ? `<p class="record-note">${language==='tr'?'Haritadaki pin görev bölgesini gösterir; aracın güncel veya son park konumunu göstermez.':'The map pin marks the mission site, not the vehicle’s current or final parked position.'}</p>` : '';
    const recordType = record.type==='crew'?tr('missionType'):record.type === 'aircraft' ? (language==='tr'?'Helikopter':'Aircraft') : record.type === 'rover' ? (language==='tr'?'Gezgin araç':'Rover') : record.type === 'impactor' ? (language==='tr'?'Çarpma / iniş artığı':'Impact / descent hardware') : (language==='tr'?'Lander / bilim donanımı':'Lander / science equipment');
    const isCrew=record.type==='crew';
    const statusLabel = isCrew ? tr('landed') : record.status === 'active' ? tr('faal') : record.status === 'inactive' ? tr('inactive') : (language==='tr'?'DURUM BELİRSİZ':'STATUS UNKNOWN');
    const heroStory=displayStory(record),crewPanel=isCrew?`<section class="crew-panel"><small>${tr('crew')}</small><b>${record.crew}</b><span>${tr('landing')}: ${displayRegion(record)}</span></section>`:'';
    $('#detail-content').innerHTML = `<div class="detail-hero"><div class="detail-kicker ${isCrew?'status-crew':record.status === 'active' ? 'status-active' : 'status-inactive'}">${type} · ${record.date} · ${statusLabel}</div><h2 class="detail-title">${displayName(record)}</h2><div class="detail-subtitle">${displayRegion(record).toUpperCase()}</div><p class="detail-desc">${heroStory}</p>${crewPanel}${note}</div><div id="record-media" class="record-media" data-record-id="${record.id}"><div class="media-loading"><i></i><span>${language==='tr'?'NASA arşivi aranıyor':'Searching NASA archive'}</span></div></div><div class="meta-grid"><div class="meta-item"><small>${tr('year')}</small><b>${record.date}</b></div><div class="meta-item"><small>${isCrew?tr('missionResult'):tr('status')}</small><b class="status-text ${isCrew?'status-crew':record.status === 'active' ? 'status-active' : 'status-inactive'}">${statusLabel}</b></div><div class="meta-item"><small>${tr('coords')}</small><b>${displayCoordinates(record)}</b></div><div class="meta-item"><small>${tr('type')}</small><b>${recordType}</b></div></div>`;
    $('#confidence-value').textContent = language==='tr'?(record.confidenceLabelTr||record.confidenceLabel):(record.confidence==='exact'?'HIGH CONFIDENCE':record.confidence==='site'?'SITE LEVEL':'UNKNOWN');
    $('#confidence-value').style.color = record.confidence === 'site' ? 'var(--amber)' : record.confidence === 'exact' ? 'var(--accent)' : '#9ba09e';
    $('#confidence-meter').className = record.confidence === 'site' ? 'site' : record.confidence === 'exact' ? '' : 'unknown';
    $('#confidence-text').textContent = language==='en'?(record.confidenceTextEn||'Coordinates and their confidence follow the linked NASA source.'):(record.confidenceTextTr||record.confidenceText);
    $('#primary-source').href = record.source;
    $('#primary-source').setAttribute('aria-label', `${record.resource}: ${language==='tr'?'NASA kaynağını aç':'open NASA source'}`);
    loadRecordMedia(record);
  }

  function nasaModelFor(record) {
    if(record.id==='perseverance') return {name:'Perseverance Rover',credit:'NASA/JPL',page:'https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/',src:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/mars-2020-perseverance-rover/Mars%202020%20Perseverance%20Rover.glb'};
    if(record.id==='insight') return {name:'InSight Lander',credit:'NASA/VTAD',page:'https://science.nasa.gov/3d-resources/insight-cruise-lander/',src:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/insight-cruise-lander/InSight%20Cruise%20Lander%20%28arm%20deployed%29.glb'};
    if(record.id==='ingenuity') return {name:'Ingenuity Helicopter',credit:'NASA/Brian E. Kumanchik',page:'https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/',src:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/ingenuity-mars-helicopter/Ingenuity%20Mars%20Helicopter.glb'};
    if(record.id.startsWith('apollo-')&&/(?:-lm(?:-|$)|-descent$|-ascent$)/.test(record.id)) return {name:'Apollo Lunar Module',credit:'NASA/Michael D. Carbajal',page:'https://science.nasa.gov/3d-resources/apollo-lunar-module/',src:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/apollo-lunar-module/Apollo%20Lunar%20Module.glb',representative:true};
    return null;
  }

  function nasaImageQuery(record) {
    const id=record.id;
    if(record.type==='crew') return `Apollo ${id.match(/^apollo-(\d+)/)?.[1]} moonwalkers lunar surface`;
    if(id.startsWith('apollo-')) {
      const n=id.match(/^apollo-(\d+)/)?.[1]||'';
      if(id.includes('lrv')) return `Apollo ${n} Lunar Roving Vehicle on Moon`;
      if(id.includes('alsep')) return `Apollo ${n} ALSEP lunar surface experiments`;
      if(id.includes('sivb')) return `Apollo ${n} Saturn IVB Moon impact`;
      if(id.includes('subsatel')) return `Apollo ${n} subsatellite Moon`;
      return `Apollo ${n} lunar module Moon surface`;
    }
    if(id.startsWith('survey-or-')) return `Surveyor ${id.match(/\d+/)?.[0]} Moon lander`;
    if(id.startsWith('ranger-')) return `Ranger ${id.match(/\d+/)?.[0]} spacecraft Moon`;
    if(id.startsWith('lunar-orbiter-')) return `Lunar Orbiter ${id.match(/\d+/)?.[0]} Moon spacecraft`;
    if(id==='explorer-35'||id==='explorer-49') return `${record.name} lunar spacecraft`;
    if(id==='lunar-prospector'||id.startsWith('grail-')||id==='ladee') return `${record.name} Moon NASA mission`;
    if(id.startsWith('viking-')) return `${record.name} Mars surface lander`;
    if(id.startsWith('pathfinder')) return `Mars Pathfinder ${id==='pathfinder'?'Sojourner rover':'lander'} Mars`;
    if(id.startsWith('spirit')||id.startsWith('opportunity')) return `${id.startsWith('spirit')?'Spirit':'Opportunity'} Mars rover`;
    if(id==='curiosity') return 'Curiosity Mars rover';
    if(id==='perseverance') return 'Perseverance Mars rover';
    if(id==='insight'||id==='phoenix') return `${record.name} Mars lander`;
    if(id==='ingenuity') return 'Ingenuity Mars helicopter';
    if(id.startsWith('deep-space-2')) return 'Deep Space 2 Mars penetrator';
    if(id==='mars-polar-lander') return 'Mars Polar Lander NASA';
    return `${record.name} ${world==='moon'?'Moon':'Mars'} NASA spacecraft`;
  }

  function nasaImageQueries(record) {
    const primary=nasaImageQuery(record),apollo=record.id.match(/^apollo-(\d+)/)?.[1],worldName=world==='moon'?'Moon':'Mars';
    const fallbacks=apollo
      ? [`Apollo ${apollo} lunar surface NASA`, `Apollo ${apollo} ${record.type==='crew'?'astronauts Moonwalk':record.type==='rover'?'lunar rover':'Moon mission'} NASA`]
      : [`${record.name} NASA ${worldName} mission`, `${worldName} ${record.type} ${record.name} NASA`];
    return [...new Set([primary,...fallbacks])];
  }

  function ensureModelViewer() {
    if(customElements.get('model-viewer')) return Promise.resolve();
    if(modelViewerPromise) return modelViewerPromise;
    modelViewerPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.type='module';script.src=modelViewerSrc;
      script.onload=()=>customElements.whenDefined('model-viewer').then(resolve,reject);
      script.onerror=()=>reject(new Error('NASA 3D viewer could not load'));
      document.head.append(script);
    });
    return modelViewerPromise;
  }

  async function findNasaImage(record) {
    const queries=nasaImageQueries(record),cacheKey=queries.join(' · ');
    if(mediaCache.has(cacheKey)) return mediaCache.get(cacheKey);
    const promise=(async()=>{
      const candidates=new Map();
      for(const query of queries){
        try{
          const url=`https://images-api.nasa.gov/search?${new URLSearchParams({q:query,media_type:'image',page_size:'8'})}`;
          const response=await fetch(url,{headers:{Accept:'application/json'}});
          if(!response.ok)continue;
          const json=await response.json(),items=json.collection?.items||[];
          const terms=query.toLowerCase().split(/[^a-z0-9]+/).filter(word=>word.length>2&&!['nasa','moon','mars','rover','spacecraft','lander','surface','mission'].includes(word));
          const searchable=item=>`${item.data?.[0]?.title||''} ${item.data?.[0]?.description||''} ${(item.data?.[0]?.keywords||[]).join(' ')}`.toLowerCase();
          items.sort((a,b)=>terms.reduce((n,t)=>n+(searchable(b).includes(t)?1:0),0)-terms.reduce((n,t)=>n+(searchable(a).includes(t)?1:0),0));
          for(const item of items){
            const preview=item.links?.find(link=>link.rel==='preview'&&/^https:\/\//.test(link.href));
            if(!preview||candidates.has(preview.href))continue;
            const data=item.data?.[0]||{};
            candidates.set(preview.href,{url:preview.href,title:data.title||record.name,credit:data.center||'NASA Image and Video Library',page:`https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id||'')}`});
            if(candidates.size>=12)break;
          }
          if(candidates.size>=8)break;
        }catch(error){console.warn('NASA image search query failed',query,error);}
      }
      return [...candidates.values()];
    })();
    mediaCache.set(cacheKey,promise);
    try{const result=await promise;if(!result.length)mediaCache.delete(cacheKey);return result;}
    catch(error){mediaCache.delete(cacheKey);throw error;}
  }

  async function loadRecordMedia(record) {
    const host=$('#record-media');if(!host)return;
    const model=nasaModelFor(record);
    if(model&&!model.legacy){
      try{
        await ensureModelViewer();if($('#record-media')!==host||host.dataset.recordId!==record.id)return;
        const viewer=document.createElement('model-viewer');viewer.setAttribute('src',model.src);viewer.setAttribute('alt',model.name);viewer.setAttribute('camera-controls','');viewer.setAttribute('auto-rotate','');viewer.setAttribute('rotation-per-second','13deg');viewer.setAttribute('shadow-intensity','.65');viewer.setAttribute('exposure','1.08');viewer.setAttribute('loading','lazy');viewer.className='record-model';
        host.replaceChildren(viewer,mediaCredit(model.credit,model.page,model.representative?`${model.name} · representative model`:model.name));
        viewer.addEventListener('error',()=>loadRecordImage(record,host),{once:true});return;
      }catch{}
    }
    await loadRecordImage(record,host);
  }

  function mediaCredit(credit,page,label) {
    const caption=document.createElement('div');caption.className='media-caption';
    const text=document.createElement('span');text.textContent=`${label} · ${credit}`;
    const link=document.createElement('a');link.href=page;link.target='_blank';link.rel='noreferrer';link.textContent=language==='tr'?'NASA kaynağı ↗':'NASA source ↗';
    caption.append(text,link);return caption;
  }

  async function loadRecordImage(record,host) {
    try{
      const images=await findNasaImage(record);if($('#record-media')!==host||host.dataset.recordId!==record.id) return;
      let image=null;
      const probes=await Promise.all(images.slice(0,6).map(candidate=>new Promise(resolve=>{const probe=new Image();const timer=setTimeout(()=>resolve(false),3500);probe.onload=()=>{clearTimeout(timer);resolve(true);};probe.onerror=()=>{clearTimeout(timer);resolve(false);};probe.src=candidate.url;})));
      image=images.find((_,index)=>probes[index]);
      if(!image)throw new Error('No loadable NASA image found after mission-specific searches');
      if($('#record-media')!==host||host.dataset.recordId!==record.id)return;
      const figure=document.createElement('a');figure.className='record-photo';figure.href=image.page;figure.target='_blank';figure.rel='noreferrer';
      const img=document.createElement('img');img.src=image.url;img.alt=image.title;img.loading='lazy';img.decoding='async';
      const title=document.createElement('span');title.className='record-photo-title';title.textContent=image.title;
      figure.append(img,title);host.replaceChildren(figure,mediaCredit(image.credit,image.page,image.title));
    }catch{
      if($('#record-media')!==host||host.dataset.recordId!==record.id)return;
      renderAtlasFallback(record,host);
    }
  }

  function renderAtlasFallback(record,host){
    const body=records.moon.includes(record)?'moon':'mars',label=body==='moon'?'LRO WAC GLOBAL MOSAIC':'VIKING GLOBAL MOSAIC';
    const figure=document.createElement('div');figure.className='record-photo record-photo-context';
    const img=document.createElement('img');img.src=`./assets/maps/${body}-color.jpg`;img.alt=`NASA ${label.toLowerCase()} showing the mission region`;img.loading='lazy';img.decoding='async';
    const title=document.createElement('span');title.className='record-photo-title';title.textContent=`${label} · ${displayRegion(record).toUpperCase()} · ${language==='tr'?'GÖREV BÖLGESİ':'MISSION REGION'}`;
    figure.append(img,title);
    const credit=mediaCredit(body==='moon'?'NASA LRO WAC':'NASA Viking Orbiter',`https://trek.nasa.gov/${body}/`,language==='tr'?'YÜZEY ATLASI · BÖLGE BAĞLAMI':'SURFACE ATLAS · REGIONAL CONTEXT');
    host.replaceChildren(figure,credit);
  }

  function renderList() {
    const shown = filteredRecords();
    list.replaceChildren();
    $('#record-count').textContent = `${String(shown.length).padStart(2, '0')} ${language==='tr'?'GÖSTERİLİYOR':'SHOWN'}`;
    shown.forEach(record => {
      const button = document.createElement('button');
      button.className = `record-item ${record.status === 'active' ? 'is-active' : 'is-inactive'}${selected === record.id ? ' active' : ''}`;
      button.dataset.confidence = record.confidence;
      const symbol = record.type==='crew'?'A':record.type === 'aircraft' ? 'H' : record.type === 'rover' ? 'R' : record.type === 'impactor' ? 'I' : record.type === 'equipment' ? 'E' : 'L';
      button.innerHTML = `<span class="record-symbol">${symbol}</span><span><b>${displayName(record)}</b><small>${displayRegion(record)}</small></span><time>${record.date}</time>`;
      button.addEventListener('click', () => selectRecord(record.id, true));
      list.append(button);
    });
    const current = shown.find(record => record.id === selected) || shown[0];
    if (current && current.id !== selected) selected = current.id;
    if (!current) selected = null;
    renderDetail(current);
    map?.draw();
  }

  function selectRecord(id, focusMap = false) {
    selected = id;
    renderList();
    const record = records[world].find(item => item.id === id);
    if (focusMap && record) map?.focus(record);
  }

  function image(src) {
    return new Promise((resolve, reject) => {
      const item = new Image();
      item.onload = () => resolve(item);
      item.onerror = () => reject(new Error(`Surface image could not load: ${src}`));
      item.src = src;
    });
  }

  function imagePixels(source,maxWidth=1024){
    const scale=Math.min(1,maxWidth/source.naturalWidth),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(source.naturalWidth*scale));canvas.height=Math.max(1,Math.round(source.naturalHeight*scale));
    const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0,canvas.width,canvas.height);return {width:canvas.width,height:canvas.height,pixels:context.getImageData(0,0,canvas.width,canvas.height).data};
  }
  const clamp01=value=>Math.max(0,Math.min(1,value));
  function createDottedMoon(canvas,albedo,dem){
    const cssSize=canvas.getBoundingClientRect().width||180,dpr=Math.min(window.devicePixelRatio||1,2.5),size=Math.max(96,Math.round(cssSize*dpr));
    canvas.width=size;canvas.height=size;const radius=size*.445,step=Math.max(1.45,dpr*.78),dots=[],c={a:albedo,dem};
    const pixel=(data,w,h,x,y)=>{x=(x%w+w)%w;y=Math.max(0,Math.min(h-1,y));return data[(y*w+x)*4];};
    for(let y=-radius;y<=radius;y+=step)for(let x=-radius;x<=radius;x+=step){
      const nx=x/radius,ny=-y/radius,radial=nx*nx+ny*ny;if(radial>=1)continue;
      const nz=Math.sqrt(1-radial),lon=Math.atan2(nx,nz),lat=Math.asin(ny),
        ax=Math.round((lon/(Math.PI*2)+.5)*c.a.width),ay=Math.round((.5-lat/Math.PI)*c.a.height),
        dx=Math.round((lon/(Math.PI*2)+.5)*c.dem.width),dy=Math.round((.5-lat/Math.PI)*c.dem.height),
        texture=pixel(c.a.pixels,c.a.width,c.a.height,ax,ay)/255,
        terrain=pixel(c.dem.pixels,c.dem.width,c.dem.height,dx,dy)/255,
        slopeX=(pixel(c.dem.pixels,c.dem.width,c.dem.height,dx+4,dy)-pixel(c.dem.pixels,c.dem.width,c.dem.height,dx-4,dy))/255,
        slopeY=(pixel(c.dem.pixels,c.dem.width,c.dem.height,dx,dy+4)-pixel(c.dem.pixels,c.dem.width,c.dem.height,dx,dy-4))/255,
        relief=clamp01(.78+(-slopeX+slopeY*.35)*1.5),
        surface=clamp01((texture*.68+terrain*.24+.08)*relief),
        seed=Math.abs(Math.sin((x+431.7)*127.1+(y+173.3)*311.7)*43758.5453),
        random=seed-Math.floor(seed);
      dots.push({x:size/2+x,y:size/2+y,nx,ny,surface,sweep:(nx+1)*.5,radius:step*(.48+surface*.15),sparkle:random>.995,sparklePhase:random*Math.PI*2});
    }
    return {size,step,dots,context:canvas.getContext('2d')};
  }
  function lunarShadowOffset(illumination){
    let low=0,high=2;
    for(let i=0;i<18;i++){
      const offset=(low+high)*.5,half=offset*.5;
      const lit=1-(2*Math.acos(Math.min(1,half))-half*Math.sqrt(Math.max(0,4-offset*offset)))/Math.PI;
      if(lit<illumination)low=offset;else high=offset;
    }
    return (low+high)*.5;
  }
  function paintDottedMoon(model,illumination,sweepProgress,now=performance.now()){
    const {size,step,dots,context}=model;
    context.clearRect(0,0,size,size);
    const shadowX=lunarShadowOffset(illumination),bucketCount=9,buckets=Array.from({length:bucketCount},()=>[]),sparkles=[];
    for(const dot of dots){
      if(dot.sweep>sweepProgress)continue;
      if((dot.nx-shadowX)**2+dot.ny**2<=1)continue;
      const brightness=clamp01(.28+dot.surface*.68),level=Math.min(bucketCount-1,Math.floor(brightness*(bucketCount-1)));
      buckets[level].push([dot.x,dot.y,dot.radius]);
      if(dot.sparkle){const pulse=(Math.sin(now*.0018+dot.sparklePhase)+1)*.5;if(pulse>.91)sparkles.push([dot.x,dot.y,dot.radius,pulse]);}
    }
    buckets.forEach((dots,level)=>{
      if(!dots.length)return;const tone=Math.round(214+level*4.6);context.beginPath();
      for(const [x,y,r] of dots){context.moveTo(x+r,y);context.arc(x,y,r,0,Math.PI*2);}
      const representativeAlpha=.58+(level/(bucketCount-1))*.4;
      context.fillStyle=`rgba(${tone},${tone+4},${tone-2},${representativeAlpha.toFixed(3)})`;context.fill();
    });
    context.save();context.shadowColor='rgba(226,244,210,.8)';context.shadowBlur=3;
    for(const [x,y,r,pulse] of sparkles){context.beginPath();context.arc(x,y,r*(1.1+pulse*.35),0,Math.PI*2);context.fillStyle=`rgba(244,250,232,${(.15+pulse*.32).toFixed(3)})`;context.fill();}
    context.restore();
  }
  async function runMoonPhaseJourney(){
    const boot=$('#boot-screen'),canvas=$('#phase-moon'),caption=$('#phase-current');
    try{
      const [surface,elevation]=await Promise.all([image('./assets/maps/moon-color.jpg'),image('./assets/maps/moon-height.png')]);
      const albedo=imagePixels(surface),dem=imagePixels(elevation),model=createDottedMoon(canvas,albedo,dem);
      paintDottedMoon(model,.015,.035);
      caption.textContent=language==='tr'?'YENİ AY · 02% AYDINLIK':'NEW MOON · 02% ILLUMINATED';
      boot.classList.add('phase-ready');
      const started=performance.now(),duration=1250;
      await new Promise(resolve=>{
        const frame=now=>{
          const t=Math.min(1,(now-started)/duration),eased=t*t*(3-2*t),illumination=.015+.985*eased,sweep=.035+.965*eased;
          paintDottedMoon(model,illumination,sweep,now);
          const label=illumination<.09?'NEW MOON':illumination<.39?'WAXING CRESCENT':illumination<.61?'FIRST QUARTER':illumination<.96?'WAXING GIBBOUS':'FULL MOON';
          const localized=language==='tr'?({'NEW MOON':'YENİ AY','WAXING CRESCENT':'HİLAL','FIRST QUARTER':'İLK DÖRDÜN','WAXING GIBBOUS':'ŞİŞKİN AY','FULL MOON':'DOLUNAY'}[label]):label;
          caption.textContent=`${localized} · ${String(Math.round(illumination*100)).padStart(2,'0')}% ${language==='tr'?'AYDINLIK':'ILLUMINATED'}`;
          if(t<1)requestAnimationFrame(frame);else resolve();
        };
        requestAnimationFrame(frame);
      });
      caption.textContent=language==='tr'?'DOLUNAY · ARŞİV AÇILIYOR':'FULL MOON · ARCHIVE OPENING';
      boot.classList.add('phase-complete');await new Promise(resolve=>setTimeout(resolve,200));
    }catch(error){console.warn('Dotted Moon artwork could not load',error);}
    boot.classList.add('phase-ready');
  }

  class SiteMeshMap {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', {antialias: true, alpha: true});
      this.spaceCanvas = $('#space-canvas');
      this.spaceContext = this.spaceCanvas.getContext('2d', {alpha: true});
      this.glowCanvas = $('#space-glow-canvas');
      this.glowContext = this.glowCanvas.getContext('2d', {alpha: true});
      this.starPoints = [];
      this.deepStarPoints = [];
      this.dimStarCatalog = Array.from({length:18000},(_,index)=>{let seed=(index+1)*16807%2147483647;const random=()=>{seed=seed*48271%2147483647;return seed/2147483647;};const ra=random()*360,dec=Math.asin(random()*2-1)*180/Math.PI,mag=6.01+random()*3.45,bv=random()*1.65;return {ra,dec,mag,bv};});
      this.pointerTarget = null;
      this.pointerCurrent = null;
      this.starAnimation = 0;
      this.objectLayer = $('#space-objects');
      this.pinLayer = $('#mesh-pins'); this.labelLayer = $('#planet-labels');
      if (!this.gl) throw new Error('Bu tarayıcı WebGL desteklemiyor.');
      this.program = this.createProgram();
      this.locations = {};
      this.view = {lon: 0, lat: 0, zoom: 1, panX: 0, panY: 0};
      this.loadVersion = 0;
      this.setupGL();
    }

    compile(type, source) {
      const gl = this.gl, shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }

    createProgram() {
      const vertex = `attribute vec2 a_uv; attribute float a_height;
        uniform vec2 u_view; uniform vec2 u_pan; uniform vec4 u_camera; uniform float u_relief;
        varying vec2 v_uv;
        void main() {
          float lon = radians(a_uv.x * 360.0 - 180.0);
          float lat = radians(90.0 - a_uv.y * 180.0);
          float radius = 1.0 + (a_height - .42) * u_relief;
          vec3 point = radius * vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
          float centerLon = radians(u_camera.x), centerLat = radians(u_camera.y);
          float x1 = cos(centerLon) * point.x - sin(centerLon) * point.z;
          float z1 = sin(centerLon) * point.x + cos(centerLon) * point.z;
          float y2 = cos(centerLat) * point.y - sin(centerLat) * z1;
          float z2 = sin(centerLat) * point.y + cos(centerLat) * z1;
          float distance = 1.05 + 1.0 / u_camera.z;
          float perspective = 1.0 / max(.05, distance - z2);
          float scale = min(u_view.x, u_view.y) * .62 * perspective;
          vec2 pixel = vec2(u_view.x * .5 + x1 * scale + u_pan.x, u_view.y * .5 - y2 * scale + u_pan.y);
          gl_Position = vec4(pixel.x * 2.0 / u_view.x - 1.0, 1.0 - pixel.y * 2.0 / u_view.y, .5 - z2 * .45, 1.0);
          v_uv = a_uv;
        }`;
      const fragment = `precision mediump float;
        uniform sampler2D u_elevation; uniform sampler2D u_surface; uniform sampler2D u_detail;
        uniform vec4 u_detail_bounds; uniform float u_detail_ready; uniform float u_zoom;
        uniform vec2 u_texel; uniform vec2 u_color_range;
        uniform float u_contour_count; uniform float u_major_every; uniform float u_theme;
        uniform vec3 u_contour_color; uniform vec3 u_major_color;
        varying vec2 v_uv;
        vec3 palette(float t) {
          if (u_theme < .5) {
            vec3 c0=vec3(.18,.16,.15), c1=vec3(.34,.30,.27), c2=vec3(.52,.49,.45), c3=vec3(.70,.67,.61), c4=vec3(.89,.86,.78);
            return t<.25 ? mix(c0,c1,smoothstep(0.,.25,t)) : t<.55 ? mix(c1,c2,smoothstep(.25,.55,t)) : t<.82 ? mix(c2,c3,smoothstep(.55,.82,t)) : mix(c3,c4,smoothstep(.82,1.,t));
          }
          vec3 c0=vec3(.24,.075,.035), c1=vec3(.49,.17,.075), c2=vec3(.77,.32,.12), c3=vec3(.94,.51,.23), c4=vec3(1.0,.72,.43);
          return t<.2 ? mix(c0,c1,smoothstep(0.,.2,t)) : t<.48 ? mix(c1,c2,smoothstep(.2,.48,t)) : t<.78 ? mix(c2,c3,smoothstep(.48,.78,t)) : mix(c3,c4,smoothstep(.78,1.,t));
        }
        void main() {
          vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
          vec2 stepUV=u_texel*5.0;
          float center=texture2D(u_elevation,uv).r;
          float east=texture2D(u_elevation,uv+vec2(stepUV.x,0.)).r;
          float west=texture2D(u_elevation,uv-vec2(stepUV.x,0.)).r;
          float north=texture2D(u_elevation,uv+vec2(0.,stepUV.y)).r;
          float south=texture2D(u_elevation,uv-vec2(0.,stepUV.y)).r;
          float elevation=center*.5+(east+west+north+south)*.125;
          float reliefShade=clamp(.90+(west-east+north-south)*18.0,.76,1.08);
          float elevationTint=clamp((elevation-u_color_range.x)/(u_color_range.y-u_color_range.x),0.,1.);
          vec3 topoColor=palette(elevationTint)*reliefShade;
          float finePhase = fract(elevationTint * u_contour_count);
          float fineDistance = min(finePhase, 1.0 - finePhase);
          float fineLine = 1.0 - smoothstep(.025, .09, fineDistance);
          float majorPhase = fract(elevationTint * (u_contour_count / u_major_every));
          float majorDistance = min(majorPhase, 1.0 - majorPhase);
          float majorLine = 1.0 - smoothstep(.025, .11, majorDistance);
          topoColor = mix(topoColor, u_contour_color, fineLine * .45);
          topoColor = mix(topoColor, u_major_color, majorLine * .94);
          vec3 surface=texture2D(u_surface,uv).rgb;
          float dx=fract(v_uv.x-u_detail_bounds.x);
          float dy=(v_uv.y-u_detail_bounds.y)/u_detail_bounds.w;
          float inDetail=step(0.,dy)*step(dy,1.)*step(dx, u_detail_bounds.z);
          vec2 detailUV=vec2(dx/u_detail_bounds.z, 1.-dy);
          vec3 detailed=texture2D(u_detail,detailUV).rgb;
          float detailAmount=u_detail_ready*inDetail;
          surface=mix(surface,detailed,detailAmount);
          // Bring the archival contour layer in sooner so the base imagery
          // gives way before users reach the coarse edge of the global mesh.
          float contourMix=smoothstep(.72,2.25,u_zoom);
          float topoStrength=mix(.94,.88,u_theme);
          vec3 color=mix(surface,topoColor,contourMix*topoStrength);
          color=mix(color,detailed,detailAmount*contourMix*.12);
          gl_FragColor = vec4(color, 1.0);
        }`;
      const gl = this.gl, program = gl.createProgram();
      gl.attachShader(program, this.compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      return program;
    }

    setupGL() {
      const gl = this.gl;
      gl.useProgram(this.program);
      this.locations.uv = gl.getAttribLocation(this.program, 'a_uv');
      this.locations.height = gl.getAttribLocation(this.program, 'a_height');
      for (const name of ['u_view', 'u_pan', 'u_camera', 'u_relief', 'u_elevation', 'u_surface', 'u_detail', 'u_detail_bounds', 'u_detail_ready', 'u_zoom', 'u_texel', 'u_color_range', 'u_contour_count', 'u_major_every', 'u_theme', 'u_contour_color', 'u_major_color']) {
        this.locations[name] = gl.getUniformLocation(this.program, name);
      }
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    }

    uploadTexture(source) {
      const gl = this.gl, texture = gl.createTexture();
      if (!texture) throw new Error('WebGL texture could not be allocated.');
      for (let i = 0; i < 8 && gl.getError() !== gl.NO_ERROR; i++) {}
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        gl.deleteTexture(texture);
        throw new Error(`WebGL texture upload failed (0x${error.toString(16)}).`);
      }
      return texture;
    }

    async setWorld(name) {
      const version = ++this.loadVersion, source = worlds[name];
      let stage = 'surface atlas';
      let surfaceImage, heightImage;
      try {
      surfaceImage = await image(`./assets/maps/${source.image}?v=20261114-17`);
      stage = 'elevation atlas';
      heightImage = await image(`./assets/maps/${source.height}?v=20261114-6`);
      if (version !== this.loadVersion) return;
      stage = 'elevation processing';
      const heightCanvas = document.createElement('canvas');
      const heightScale = Math.min(1, 2048 / heightImage.naturalWidth);
      heightCanvas.width = Math.max(1, Math.round(heightImage.naturalWidth * heightScale));
      heightCanvas.height = Math.max(1, Math.round(heightImage.naturalHeight * heightScale));
      this.elevationWidth = heightCanvas.width; this.elevationHeight = heightCanvas.height;
      const context = heightCanvas.getContext('2d', {willReadFrequently: true});
      context.drawImage(heightImage, 0, 0, heightCanvas.width, heightCanvas.height);
      const pixels = context.getImageData(0, 0, heightCanvas.width, heightCanvas.height).data;
      this.sampleHeight = (u, v) => {
        const x = Math.max(0, Math.min(heightCanvas.width - 1, Math.round(u * (heightCanvas.width - 1))));
        const y = Math.max(0, Math.min(heightCanvas.height - 1, Math.round(v * (heightCanvas.height - 1))));
        return pixels[(y * heightCanvas.width + x) * 4] / 255;
      };
      this.meshHeight = (u, v) => {
        // Gaussian smoothing on LOLA/MOLA elevation pixels suppresses isolated raster spikes.
        const sx=3/heightCanvas.width,sy=3/heightCanvas.height,weights=[1,4,6,4,1];let sum=0,total=0;
        for(let iy=-2;iy<=2;iy++)for(let ix=-2;ix<=2;ix++){const weight=weights[ix+2]*weights[iy+2];sum+=this.sampleHeight(u+ix*sx,v+iy*sy)*weight;total+=weight;}
        return sum/total;
      };
      stage = 'surface mesh';
      this.makeGrid();
      stage = 'elevation texture';
      if (this.elevationTexture) this.gl.deleteTexture(this.elevationTexture);
      this.elevationTexture = this.uploadTexture(heightCanvas);
      stage = 'surface texture';
      if (this.surfaceTexture) this.gl.deleteTexture(this.surfaceTexture);
      this.surfaceTexture = this.uploadTexture(surfaceImage);
      this.surfaceImage = surfaceImage;
      this.surfacePixelsCanvas=document.createElement('canvas');
      this.surfacePixelsCanvas.width=Math.min(1024,surfaceImage.naturalWidth); this.surfacePixelsCanvas.height=Math.min(512,surfaceImage.naturalHeight);
      const surfaceContext=this.surfacePixelsCanvas.getContext('2d',{willReadFrequently:true});
      surfaceContext.drawImage(surfaceImage,0,0,this.surfacePixelsCanvas.width,this.surfacePixelsCanvas.height); this.surfacePixels=surfaceContext.getImageData(0,0,this.surfacePixelsCanvas.width,this.surfacePixelsCanvas.height).data;
      if (this.detailTexture && this.detailTexture !== this.surfaceTexture) this.gl.deleteTexture(this.detailTexture);
      this.detailTexture = null;
      this.detailReady = false; this.detailKey = ''; this.detailLoading = ''; this.detailGeneration = 0;
      this.world = name;
      this.home();
      } catch (error) {
        throw new Error(`${name.toUpperCase()} ${stage}: ${error.message}`, {cause:error});
      }
    }

    makeGrid() {
      const columns = 960, rows = 480, bandRows = 64;
      const gl = this.gl;
      this.meshBands?.forEach(band => { gl.deleteBuffer(band.vertex); gl.deleteBuffer(band.index); });
      this.meshBands = [];
      for (let start = 0; start < rows; start += bandRows) {
        const count = Math.min(bandRows, rows - start), vertices = new Float32Array((columns + 1) * (count + 1) * 3);
        let offset = 0;
        for (let localY = 0; localY <= count; localY++) for (let x = 0; x <= columns; x++) {
          const u = x / columns, v = (start + localY) / rows;
          vertices[offset++] = u; vertices[offset++] = v; vertices[offset++] = this.meshHeight(u, v);
        }
        const indices = new Uint16Array(columns * count * 6); offset = 0;
        for (let y = 0; y < count; y++) for (let x = 0; x < columns; x++) {
          const a = y * (columns + 1) + x, b = a + 1, c = a + columns + 1, d = c + 1;
          indices[offset++] = a; indices[offset++] = c; indices[offset++] = b;
          indices[offset++] = b; indices[offset++] = c; indices[offset++] = d;
        }
        const vertex = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vertex); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        const index = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        this.meshBands.push({vertex, index, indexCount:indices.length});
      }
    }

    home() {
      this.view = {lon:0, lat:0, zoom:.82, panX:0, panY:0};
      this.draw();
    }

    project(lon, lat) {
      const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
      const lonRad = lon * Math.PI / 180, latRad = lat * Math.PI / 180;
      const u = (normalizeLon(lon) + 180) / 360, v = (90 - lat) / 180;
      const radius = 1 + ((this.meshHeight?.(u, v) ?? .42) - .42) * worlds[this.world].relief;
      const point = {x:radius * Math.cos(latRad) * Math.sin(lonRad), y:radius * Math.sin(latRad), z:radius * Math.cos(latRad) * Math.cos(lonRad)};
      const centerLon = this.view.lon * Math.PI / 180, centerLat = this.view.lat * Math.PI / 180;
      const x1 = Math.cos(centerLon) * point.x - Math.sin(centerLon) * point.z;
      const z1 = Math.sin(centerLon) * point.x + Math.cos(centerLon) * point.z;
      const y2 = Math.cos(centerLat) * point.y - Math.sin(centerLat) * z1;
      const z2 = Math.sin(centerLat) * point.y + Math.cos(centerLat) * z1;
      const distance = 1.05 + 1.0 / this.view.zoom, perspective = 1 / Math.max(.05, distance - z2);
      const scale = Math.min(width, height) * .62 * perspective;
      return {x:width / 2 + x1 * scale + this.view.panX, y:height / 2 - y2 * scale + this.view.panY, visible:z2 > .008};
    }

    surfaceAtScreen(x, y) {
      const width=this.canvas.clientWidth,height=this.canvas.clientHeight,scale=Math.min(width,height)*.62,distance=1.05+1/this.view.zoom;
      const nx=(x-width/2-this.view.panX)/scale, ny=-(y-height/2-this.view.panY)/scale;
      const a=nx*nx+ny*ny+1, discriminant=distance*distance-a*(distance*distance-1);
      if(discriminant<0)return null;
      const t=(distance-Math.sqrt(discriminant))/a;
      const cam=[nx*t,ny*t,distance-t], lon=this.view.lon*Math.PI/180,lat=this.view.lat*Math.PI/180;
      const y1=Math.cos(lat)*cam[1]+Math.sin(lat)*cam[2], z1=-Math.sin(lat)*cam[1]+Math.cos(lat)*cam[2];
      const bx=Math.cos(lon)*cam[0]+Math.sin(lon)*z1, bz=-Math.sin(lon)*cam[0]+Math.cos(lon)*z1;
      return {lon:Math.atan2(bx,bz)*180/Math.PI,lat:Math.asin(Math.max(-1,Math.min(1,y1)))*180/Math.PI};
    }

    zoomAt(x, y, nextZoom) {
      const anchor=this.surfaceAtScreen(x,y);
      if(!anchor){this.view.zoom=nextZoom;this.draw();return;}
      const targetX=x,targetY=y;
      this.view.zoom=nextZoom;
      const projected=this.project(anchor.lon,anchor.lat);
      this.view.panX+=targetX-projected.x; this.view.panY+=targetY-projected.y;
      this.draw();
    }

    focus(record) {
      if (!Number.isFinite(record.lat) || !Number.isFinite(record.lon)) return;
      this.view.lon = normalizeLon(record.lon); this.view.lat = Math.max(-85, Math.min(85, record.lat));
      this.view.zoom = Math.max(this.view.zoom, 3.3); this.view.panX = 0; this.view.panY = 0;
      this.draw();
    }

    bodyOrientation(name) {
      // IAU pole and prime-meridian models, at the JPL ephemeris epoch.
      const epoch = window.OA_SPACE_EPHEMERIS?.epoch || new Date().toISOString();
      const date = new Date(epoch), days = date.getTime() / 86400000 - Date.UTC(2000, 0, 1, 12) / 86400000;
      const T = days / 36525;
      if (name === 'mars') return {ra:317.269202 - .10927547*T, dec:54.432516 - .05827105*T, W:176.049863 + 350.891982443297*days};
      const E = [125.045- .0529921*days,250.089-.1059842*days,260.008+13.0120009*days,176.625+13.3407154*days,357.529+.9856003*days,311.589+26.4057084*days,134.963+13.0649930*days,276.617+.3287146*days,34.226+1.7484877*days,15.134-.1589763*days,119.743+.0036096*days,239.961+.1643573*days,25.053+12.9590088*days].map(value=>value*Math.PI/180);
      const d2=Math.PI/180, sin=(index)=>Math.sin(E[index]);
      return {ra:269.9949+.0031*T+3.8787*sin(0)-.1204*sin(1)-.0700*sin(2)+.0172*sin(3)-.0072*sin(5)+.0052*sin(7)+.0043*sin(9),dec:66.5392+.0130*T+1.5419*Math.cos(E[0])+.0239*Math.cos(E[1])-.0278*Math.cos(E[2])+.0068*Math.cos(E[3])-.0029*Math.cos(E[5])+.0009*Math.cos(E[6])+.0008*Math.cos(E[9]),W:38.3213+13.17635815*days-1.4e-12*days*days+3.5610*sin(0)+.1208*sin(1)-.0642*sin(2)+.0158*sin(3)+.0252*sin(4)-.0066*sin(5)-.0047*sin(6)-.0046*sin(7)+.0028*sin(8)+.0052*sin(9)+.0040*sin(10)+.0019*sin(11)-.0044*sin(12)};
    }

    rotateBodyToIcrf(v, orientation) {
      const rad=Math.PI/180, w=orientation.W*rad, tilt=(90-orientation.dec)*rad, pole=(orientation.ra+90)*rad;
      const x1=Math.cos(w)*v[0]-Math.sin(w)*v[1], y1=Math.sin(w)*v[0]+Math.cos(w)*v[1], z1=v[2];
      const x2=x1, y2=Math.cos(tilt)*y1-Math.sin(tilt)*z1, z2=Math.sin(tilt)*y1+Math.cos(tilt)*z1;
      return [Math.cos(pole)*x2-Math.sin(pole)*y2,Math.sin(pole)*x2+Math.cos(pole)*y2,z2];
    }

    rotateIcrfToBody(v, orientation) {
      const rad=Math.PI/180, pole=(orientation.ra+90)*rad, tilt=(90-orientation.dec)*rad, w=orientation.W*rad;
      const x1=Math.cos(pole)*v[0]+Math.sin(pole)*v[1], y1=-Math.sin(pole)*v[0]+Math.cos(pole)*v[1], z1=v[2];
      const x2=x1, y2=Math.cos(tilt)*y1+Math.sin(tilt)*z1, z2=-Math.sin(tilt)*y1+Math.cos(tilt)*z1;
      return [Math.cos(w)*x2+Math.sin(w)*y2,-Math.sin(w)*x2+Math.cos(w)*y2,z2];
    }

    drawSpace() {
      const canvas=this.spaceCanvas, ctx=this.spaceContext, width=canvas.clientWidth, height=canvas.clientHeight;
      if(!ctx || !width || !height) return;
      const dpr=Math.min(window.devicePixelRatio||1,2); canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);this.objectLayer.replaceChildren();
      const haze=ctx.createRadialGradient(width*.5,height*.46,Math.min(width,height)*.23,width*.5,height*.46,Math.max(width,height)*.72);
      haze.addColorStop(0,'rgba(40,60,88,.14)'); haze.addColorStop(.56,'rgba(17,30,54,.09)'); haze.addColorStop(1,'rgba(3,7,14,0)'); ctx.fillStyle=haze; ctx.fillRect(0,0,width,height);
      const orientation=this.bodyOrientation(this.world), offset=this.world==='moon'?40:0, cameraLon=(this.view.lon+offset)*Math.PI/180, cameraLat=this.view.lat*Math.PI/180;
      const focal=Math.min(width,height)*.62, centerX=width/2+this.view.panX, centerY=height/2+this.view.panY;
      const toCamera=(body)=>{const x1=Math.cos(cameraLon)*body[0]-Math.sin(cameraLon)*body[2],z1=Math.sin(cameraLon)*body[0]+Math.cos(cameraLon)*body[2],y2=Math.cos(cameraLat)*body[1]-Math.sin(cameraLat)*z1,z2=Math.sin(cameraLat)*body[1]+Math.cos(cameraLat)*z1;return[x1,y2,z2];};
      const starPoints=[];
      for(const star of (window.OA_STAR_CATALOG||[])) {
        const [ra,dec,mag,bv,name]=star, a=ra*Math.PI/180, d=dec*Math.PI/180, icrf=[Math.cos(d)*Math.cos(a),Math.cos(d)*Math.sin(a),Math.sin(d)];
        const p=toCamera(this.rotateIcrfToBody(icrf,orientation)); if(p[2]>=-.015)continue;
        const x=centerX+focal*p[0]/-p[2],y=centerY-focal*p[1]/-p[2]; if(x<0||x>width||y<0||y>height)continue;
        const size=mag<0?1.55:mag<1.5?1.2:mag<3?.85:.55, alpha=Math.max(.18,Math.min(.94,1.05-(mag+1)*.12));
        const warm=bv>.55, color=warm?`rgba(224,207,187,${alpha*.74})`:`rgba(190,208,231,${alpha*.74})`;
        ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
        if(name&&mag<1.4){ctx.font='7px ui-monospace,monospace';ctx.fillStyle='rgba(174,187,208,.55)';ctx.fillText(name,x+4,y-3);}
        starPoints.push({x,y,size,mag,bv,name});
      }
      const vectors=window.OA_SPACE_EPHEMERIS?.worlds?.[this.world]||{};
      this.starPoints=starPoints;
      const deepStarPoints=[];
      for(const star of this.dimStarCatalog) {
        const {ra,dec,mag,bv}=star,a=ra*Math.PI/180,d=dec*Math.PI/180;
        const icrf=[Math.cos(d)*Math.cos(a),Math.cos(d)*Math.sin(a),Math.sin(d)];
        const p=toCamera(this.rotateIcrfToBody(icrf,orientation));if(p[2]>=-.015)continue;
        const x=centerX+focal*p[0]/-p[2],y=centerY-focal*p[1]/-p[2];
        if(x<0||x>width||y<0||y>height)continue;
        deepStarPoints.push({x,y,mag,bv,phase:(ra*17+dec*31)%6.28});
      }
      this.deepStarPoints=deepStarPoints;
      const cameraDistance=1.05+1/this.view.zoom, bodyRadius=this.world==='moon'?1737.4:3389.5;
      const names={earth:'Earth',sun:'Sun',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',phobos:'Phobos',deimos:'Deimos'};
      for(const [key,vector] of Object.entries(vectors)) {
        if(!names[key]||!vector)continue;
        const body=this.rotateIcrfToBody(vector,orientation).map(value=>value/bodyRadius), p=toCamera(body), depth=cameraDistance-p[2];
        if(depth<=0)continue;
        const ray=[p[0],p[1],p[2]-cameraDistance], a=ray[0]*ray[0]+ray[1]*ray[1]+ray[2]*ray[2], b=2*cameraDistance*ray[2], c=cameraDistance*cameraDistance-1;
        const discriminant=b*b-4*a*c;
        if(discriminant>=0) { const hit=(-b-Math.sqrt(discriminant))/(2*a); if(hit>0&&hit<1)continue; }
        const x=centerX+focal*p[0]/depth,y=centerY-focal*p[1]/depth;
        if(x<5||x>width-5||y<5||y>height-5)continue;
        const label=document.createElement('span'); label.className='space-name'; label.style.left=`${x}px`;label.style.top=`${y}px`;label.textContent=names[key];
        label.title=`${names[key]} · NASA/JPL Horizons · uzaklık ${Math.round(Math.hypot(...vector.slice(0,3))).toLocaleString('en-US')} km`;
        this.objectLayer.append(label);
      }
      const ephem=window.OA_SPACE_EPHEMERIS;
      $('#space-caption').textContent=`STAR FIELD · HYG/J2000 · JPL ${ephem?.epoch?.slice(0,10)||'EPHEMERIS'}${this.world==='moon'?' · +40° COMPOSITION VIEW':''}`;
      this.prepareGlowCanvas(width,height,dpr);
      if(this.pointerTarget)this.animatePointerStars();
    }

    prepareGlowCanvas(width,height,dpr) {
      this.glowCanvas.width=Math.round(width*dpr);this.glowCanvas.height=Math.round(height*dpr);
      this.glowContext.setTransform(dpr,0,0,dpr,0,0);
      this.paintPointerStars(performance.now());
    }

    setPointer(x,y) {
      this.pointerTarget={x,y};
      if(!this.pointerCurrent)this.pointerCurrent={x,y};
      this.animatePointerStars();
    }

    clearPointer() {
      this.pointerTarget=null;
      if(this.starAnimation)cancelAnimationFrame(this.starAnimation);
      this.starAnimation=0;this.pointerCurrent=null;
      this.glowContext.clearRect(0,0,this.glowCanvas.width,this.glowCanvas.height);
    }

    animatePointerStars() {
      if(this.starAnimation)return;
      const tick=(now)=>{
        this.starAnimation=0;
        if(!this.pointerTarget)return;
        this.paintPointerStars(now);
        const p=this.pointerCurrent,t=this.pointerTarget;
        if(Math.hypot(t.x-p.x,t.y-p.y)>0.35||this.pointerTarget) this.starAnimation=requestAnimationFrame(tick);
      };
      this.starAnimation=requestAnimationFrame(tick);
    }

    paintPointerStars(now) {
      const ctx=this.glowContext,canvas=this.glowCanvas,width=canvas.clientWidth,height=canvas.clientHeight,p=this.pointerCurrent||this.pointerTarget;
      if(!ctx||!p||!width||!height)return;
      const target=this.pointerTarget||p;p.x+=(target.x-p.x)*.16;p.y+=(target.y-p.y)*.16;
      const time=now*.001,radius=145;
      ctx.clearRect(0,0,width,height);ctx.save();
      for(const star of this.deepStarPoints){
        const dx=star.x-p.x,dy=star.y-p.y,distance=Math.hypot(dx,dy);if(distance>radius)continue;
        const edge=Math.max(0,1-(distance/radius)**3),base=Math.max(.04,Math.min(.30,(9.7-star.mag)*.07));
        const alpha=edge*base*(.9+.1*Math.sin(time*1.7+star.phase));if(alpha<.012)continue;
        const color=star.bv>.55?'255,231,202':'218,232,255';
        ctx.fillStyle=`rgba(${color},${alpha})`;ctx.fillRect(star.x,star.y,.8,.8);
        if(star.mag<7.1&&edge>.55){
          const length=(7.1-star.mag)*.42;ctx.strokeStyle=`rgba(${color},${alpha*.24})`;ctx.lineWidth=.4;
          ctx.beginPath();ctx.moveTo(star.x-length,star.y);ctx.lineTo(star.x+length,star.y);ctx.moveTo(star.x,star.y-length*.7);ctx.lineTo(star.x,star.y+length*.7);ctx.stroke();
        }
      }
      ctx.restore();
    }

    drawOrientation() {
      const card=$('#orientation-card'),canvas=$('#orientation-globe'),ctx=canvas?.getContext('2d');
      if(!card||!ctx||!this.surfacePixels)return;
      const visible=this.view.zoom>=4.3;card.classList.toggle('visible',visible);if(!visible)return;
      const size=canvas.width,half=(size-4)/2,imgW=this.surfacePixelsCanvas.width,imgH=this.surfacePixelsCanvas.height;
      const centerLon=this.view.lon*Math.PI/180,centerLat=this.view.lat*Math.PI/180;
      const image=ctx.createImageData(size,size),data=image.data;
      for(let py=0;py<size;py++)for(let px=0;px<size;px++){
        const nx=(px-size/2)/half,ny=(size/2-py)/half,r2=nx*nx+ny*ny,index=(py*size+px)*4;
        if(r2>1){data[index+3]=0;continue;}
        const camZ=Math.sqrt(1-r2),y1=Math.cos(centerLat)*ny+Math.sin(centerLat)*camZ,z1=-Math.sin(centerLat)*ny+Math.cos(centerLat)*camZ;
        const bx=Math.cos(centerLon)*nx+Math.sin(centerLon)*z1,bz=-Math.sin(centerLon)*nx+Math.cos(centerLon)*z1;
        const lon=Math.atan2(bx,bz),lat=Math.asin(Math.max(-1,Math.min(1,y1)));
        const u=((lon/(2*Math.PI)+.5)%1+1)%1,v=Math.max(0,Math.min(.999999,.5-lat/Math.PI));
        const source=(Math.floor(v*imgH)*imgW+Math.floor(u*imgW))*4,shade=.67+.33*camZ;
        data[index]=this.surfacePixels[source]*shade;data[index+1]=this.surfacePixels[source+1]*shade;data[index+2]=this.surfacePixels[source+2]*shade;data[index+3]=255;
      }
      ctx.clearRect(0,0,size,size);ctx.putImageData(image,0,0);
      ctx.beginPath();ctx.arc(size/2,size/2,half,0,Math.PI*2);ctx.strokeStyle='rgba(218,229,210,.42)';ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();ctx.arc(size/2,size/2,3.2,0,Math.PI*2);ctx.fillStyle='#b8f177';ctx.fill();
      ctx.strokeStyle='rgba(184,241,119,.7)';ctx.beginPath();ctx.moveTo(size/2-9,size/2);ctx.lineTo(size/2+9,size/2);ctx.moveTo(size/2,size/2-9);ctx.lineTo(size/2,size/2+9);ctx.stroke();
      const lat=Math.abs(this.view.lat).toFixed(1),lon=Math.abs(normalizeLon(this.view.lon)).toFixed(1);
      $('#orientation-coord').textContent=`${lat}° ${this.view.lat>=0?(language==='tr'?'K':'N'):(language==='tr'?'G':'S')} · ${lon}° ${this.view.lon>=0?(language==='tr'?'D':'E'):(language==='tr'?'B':'W')}`;
      $('#orientation-zoom').textContent=`${this.world==='moon'?'MOON':'MARS'} · ${this.view.zoom.toFixed(1)}×`;
    }

    loadDetailTiles() {
      if (!this.world || this.view.zoom < 1.65) return;
      const z=Math.min(8,Math.max(3,Math.floor(Math.log2(this.view.zoom))+3));
      if (z === 3) return;
      const cols=2**(z+1), rows=2**z, across=6, down=4;
      const centerX=Math.floor((normalizeLon(this.view.lon)+180)/360*cols);
      const centerY=Math.floor((90-this.view.lat)/180*rows);
      const startX=((centerX-Math.floor(across/2))%cols+cols)%cols;
      const startY=Math.max(0,Math.min(rows-down,centerY-Math.floor(down/2)));
      const key=`${this.world}/${z}/${startX}/${startY}`;
      if (key===this.detailKey || this.detailLoading===key) return;
      if (this.detailLoading) return;
      this.detailLoading=key;
      const generation=++this.detailGeneration, worldName=this.world, source=worlds[worldName];
      this.detailReady=false;
      this.detailTimer=setTimeout(async()=>{
        try {
          const canvas=document.createElement('canvas'); canvas.width=across*256; canvas.height=down*256;
          const ctx=canvas.getContext('2d');
          const urls=[];
          for(let y=0;y<down;y++) for(let x=0;x<across;x++) {
            const tileX=(startX+x)%cols, tileY=startY+y;
            const url=`https://trek.nasa.gov/tiles/${source.tiles}/1.0.0/default/default028mm/${z}/${tileY}/${tileX}.jpg`;
            urls.push({url,x,y});
          }
          const loaded=await Promise.all(urls.map(async tile=>({tile, image:await this.loadRemoteTile(tile.url).catch(()=>null)})));
          if(generation!==this.detailGeneration || this.world!==worldName) return;
          for(const {tile,image} of loaded) {
            const tileX=(startX+tile.x)%cols, tileY=startY+tile.y;
            const sx=tileX/cols*this.surfaceImage.naturalWidth, sy=tileY/rows*this.surfaceImage.naturalHeight;
            const sw=this.surfaceImage.naturalWidth/cols, sh=this.surfaceImage.naturalHeight/rows;
            ctx.drawImage(this.surfaceImage,sx,sy,sw,sh,tile.x*256,tile.y*256,256,256);
            if(image) ctx.drawImage(image,tile.x*256,tile.y*256,256,256);
          }
          const texture=this.uploadTexture(canvas);
          if(this.detailTexture) this.gl.deleteTexture(this.detailTexture);
          this.detailTexture=texture; this.detailBounds=[startX/cols,startY/rows,across/cols,down/rows];
          this.detailReady=true; this.detailKey=key; this.detailLoading=''; this.draw();
        } catch(error) {
          console.warn('NASA Trek yakın plan karoları yüklenemedi; küresel harita kullanılacak.',error);
          if(generation===this.detailGeneration) { this.detailLoading=''; this.detailKey=key; }
        }
      },220);
    }

    loadRemoteTile(url) {
      if (!this.tileCache) this.tileCache=new Map();
      if (this.tileCache.has(url)) return this.tileCache.get(url);
      const promise=new Promise((resolve,reject)=>{
        const item=new Image(); item.crossOrigin='anonymous';
        item.onload=()=>resolve(item); item.onerror=()=>reject(new Error(`Karo alınamadı: ${url}`)); item.src=url;
      });
      this.tileCache.set(url,promise);
      if(this.tileCache.size>160) this.tileCache.delete(this.tileCache.keys().next().value);
      return promise;
    }

    draw() {
      if (!this.elevationTexture || !this.meshBands?.length) return;
      const gl = this.gl, width = this.canvas.clientWidth, height = this.canvas.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.enableVertexAttribArray(this.locations.uv);
      gl.enableVertexAttribArray(this.locations.height);
      gl.uniform2f(this.locations.u_view, width, height);
      gl.uniform2f(this.locations.u_pan, this.view.panX, this.view.panY);
      gl.uniform4f(this.locations.u_camera, this.view.lon, this.view.lat, this.view.zoom, 0);
      gl.uniform1f(this.locations.u_relief, worlds[this.world].relief);
      this.loadDetailTiles();
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.surfaceTexture); gl.uniform1i(this.locations.u_surface, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.detailTexture || this.surfaceTexture); gl.uniform1i(this.locations.u_detail, 2);
      gl.uniform4fv(this.locations.u_detail_bounds, this.detailBounds || [0,0,1,1]);
      gl.uniform1f(this.locations.u_detail_ready, this.detailReady ? 1 : 0);
      gl.uniform1f(this.locations.u_zoom, this.view.zoom);
      gl.uniform2f(this.locations.u_texel, 1 / this.elevationWidth, 1 / this.elevationHeight);
      gl.uniform2fv(this.locations.u_color_range, worlds[this.world].colorRange);
      gl.uniform1f(this.locations.u_contour_count, worlds[this.world].contours);
      gl.uniform1f(this.locations.u_major_every, worlds[this.world].majorEvery);
      gl.uniform1f(this.locations.u_theme, this.world === 'moon' ? 0 : 1);
      gl.uniform3fv(this.locations.u_contour_color, worlds[this.world].contourColor);
      gl.uniform3fv(this.locations.u_major_color, worlds[this.world].majorColor);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.elevationTexture); gl.uniform1i(this.locations.u_elevation, 0);
      for (const band of this.meshBands) {
        gl.bindBuffer(gl.ARRAY_BUFFER, band.vertex);
        gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 12, 0);
        gl.vertexAttribPointer(this.locations.height, 1, gl.FLOAT, false, 12, 8);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, band.index);
        gl.drawElements(gl.TRIANGLES, band.indexCount, gl.UNSIGNED_SHORT, 0);
      }
      this.drawSpace();
      this.drawOrientation();
      this.renderPins();
      this.renderLandmarks();
    }

    renderPins() {
      this.pinLayer.replaceChildren();
      // A world switch is asynchronous. Never project the newly selected world's
      // records against the previous world's still-visible surface.
      if (this.world !== world) return;
      for (const record of filteredRecords()) {
        if (!Number.isFinite(record.lat) || !Number.isFinite(record.lon)) continue;
      const position = this.project(record.lon, record.lat), pin = document.createElement('button');
        if (!position.visible) continue;
        const crew=record.type==='crew';
        const crewIndex=crew?records.moon.filter(item=>item.type==='crew').findIndex(item=>item.id===record.id):0;
        const angle=crewIndex*Math.PI/3-Math.PI/2,offsetX=crew?Math.cos(angle)*21:0,offsetY=crew?Math.sin(angle)*21:0;
        pin.className = `mesh-pin ${crew?'crew-pin':record.status === 'active' ? 'operational-active' : 'operational-inactive'}${record.id === selected ? ' active' : ''}`;
        pin.style.left = `${position.x+offsetX-(crew?20:0)}px`; pin.style.top = `${position.y+offsetY-(crew?20:0)}px`;
        pin.setAttribute('aria-label', crew?`${displayName(record)} — ${record.crew} — ${displayRegion(record)}`:`${displayName(record)} — ${record.status === 'active' ? tr('faal') : tr('inactive')} — ${record.confidenceText}`);
        pin.title = displayName(record);
        pin.innerHTML = crew?`<svg viewBox="0 0 40 40" aria-hidden="true"><line x1="20" y1="20" x2="${20-offsetX}" y2="${20-offsetY}"/><circle class="site-anchor" cx="${20-offsetX}" cy="${20-offsetY}" r="2"/><circle class="crew-badge" cx="20" cy="20" r="9.5"/></svg><span>${idMissionNumber(record.id)}</span>`:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 14.5 8l5.7-1.2-1.2 5.7 3.2 4.8-5.9.5L12 22l-4.3-4.2-5.9-.5L5 12.5 3.8 6.8 9.5 8z"/><circle cx="12" cy="12.5" r="2.2"/></svg>';
        pin.addEventListener('click', event => { event.stopPropagation(); selectRecord(record.id); });
        this.pinLayer.append(pin);
      }
    }

    renderLandmarks() {
      if (!this.labelNodes) this.labelNodes=new Map();
      const visibleNames=new Set();
      const opacity=Math.max(0,Math.min(1,(this.view.zoom-2.15)/.85));
      if(opacity<=0) { this.labelNodes.forEach(node=>node.remove()); this.labelNodes.clear(); return; }
      for(const feature of landmarks[this.world]) {
        const position=this.project(feature.lon,feature.lat);
        if(!position.visible || position.x < 8 || position.x > this.canvas.clientWidth-8 || position.y < 8 || position.y > this.canvas.clientHeight-8) continue;
        visibleNames.add(feature.name);
        let label=this.labelNodes.get(feature.name);
        if(!label) { label=document.createElement('span'); label.className='planet-label'; label.textContent=feature.name; this.labelNodes.set(feature.name,label); this.labelLayer.append(label); }
        label.style.left=`${position.x}px`; label.style.top=`${position.y}px`; label.style.opacity=String(opacity);
      }
      this.labelNodes.forEach((node,name)=>{ if(!visibleNames.has(name)) { node.remove(); this.labelNodes.delete(name); } });
    }
  }

  async function initMap(introPromise) {
    try {
      map = new SiteMeshMap($('#terrain-canvas'));
      await map.setWorld(world);
      $('#map-status').style.display = 'none';
      await introPromise;$('#boot-screen').classList.add('hidden');
    } catch (error) {
      console.error('Site mesh could not load', error);
      showSurfaceError(`${world.toUpperCase()} ${language==='tr'?'YÜZEY HARİTASI AÇILAMADI':'SURFACE MAP FAILED'}`, error.message);
      await introPromise;$('#boot-screen').classList.add('hidden');
    }
  }

  function showSurfaceError(title, detail) {
    const status=$('#map-status'),symbol=document.createElement('span'),heading=document.createElement('b'),message=document.createElement('p');
    status.replaceChildren();status.classList.add('error');status.style.display='grid';
    symbol.className='status-symbol';symbol.textContent='!';heading.textContent=title;
    message.textContent=`${language==='tr'?'Yüzey yüklenemedi':'Surface could not be loaded'}: ${detail}`;
    status.append(symbol,heading,message);
  }

  function updateWorldUI() {
    document.querySelectorAll('.world-option').forEach(button => {
      const key = button.dataset.world;
      button.classList.toggle('selected', key === world);
      button.querySelector('small').textContent = `${key === 'moon' ? 'MOON' : 'MARS'} · ${String(records[key].length).padStart(2, '0')} KAYIT`;
    });
    $('#map-title').textContent = worlds[world].title; $('#layer-name').textContent = worlds[world].layer;
    document.body.dataset.world = world;
    document.querySelectorAll('.quick-world').forEach(button=>button.classList.toggle('selected',button.dataset.world===world));
    $('#toolbar-record-count').textContent=String(records[world].length).padStart(2,'0');
    $('#mini-world-label').textContent = world === 'moon' ? 'MOON / EQ' : 'MARS / EQ';
    $('#mini-planet-count').textContent = `${String(records[world].length).padStart(2, '0')} KAYIT`;
    $('#total-stat').textContent = String(records[world].length).padStart(2, '0');
    document.querySelector('.stat:nth-child(1) span').textContent = world === 'moon' ? 'Ay görev bölgesi' : 'Mars görev bölgesi';
    $('#oldest-stat').textContent = worlds[world].oldest;
    $('#timeline-range').textContent = `${worlds[world].oldest} — ${worlds[world].last}`;
    document.querySelector('.stat:nth-child(2) span').textContent = worlds[world].oldestName;
    $('#search').value = ''; filter = 'all';
    applyLanguage();
    document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
    selected = records[world][0].id; renderList();
  }

  let worldSwitchVersion = 0;
  async function setWorld(next) {
    if (next === world) return;
    const previous = world, requestVersion = ++worldSwitchVersion;
    world = next;
    updateWorldUI();
    $('#map-status').style.display = 'grid';
    $('#map-status').classList.remove('error');
    try {
      await map.setWorld(next);
      if (requestVersion === worldSwitchVersion && world === next && map.world === next) $('#map-status').style.display = 'none';
    } catch (error) {
      console.error(`Could not switch surface to ${next}`, error);
      if (requestVersion !== worldSwitchVersion) return;
      // Restore both the interface and the actual mesh. This prevents Moon
      // records from remaining projected on Mars after a failed Moon reload.
      world = previous;
      updateWorldUI();
      $('#map-status').style.display = 'grid';
      try {
        await map.setWorld(previous);
        if (requestVersion === worldSwitchVersion && map.world === previous) {
          showSurfaceError(`${next.toUpperCase()} ${language==='tr'?'YÜZEYİ AÇILAMADI':'SURFACE FAILED'}`, error.message);
        }
      } catch (recoveryError) {
        console.error(`Could not restore ${previous} surface`, recoveryError);
        if (requestVersion === worldSwitchVersion) {
          showSurfaceError(`${previous.toUpperCase()} ${language==='tr'?'YÜZEYİ GERİ YÜKLENEMEDİ':'SURFACE RECOVERY FAILED'}`, recoveryError.message);
        }
      }
    }
  }

  document.querySelectorAll('.world-option,.quick-world').forEach(button => button.addEventListener('click', () => setWorld(button.dataset.world)));
  $('#archive-toggle').addEventListener('click',()=>{const open=$('#archive-drawer').classList.toggle('open');$('#archive-toggle').setAttribute('aria-expanded',String(open));});
  $('#language-toggle').addEventListener('click',()=>{language=language==='tr'?'en':'tr';localStorage.setItem('oa-language-v2',language);applyLanguage();renderList();});
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button));
    renderList();
  }));
  $('#search').addEventListener('input', renderList);
  $('#zoom-in').addEventListener('click', () => { if (map) { const rect=map.canvas.getBoundingClientRect(); map.zoomAt(rect.width/2,rect.height/2,Math.min(map.view.zoom*1.2,16)); } });
  $('#zoom-out').addEventListener('click', () => { if (map) { const rect=map.canvas.getBoundingClientRect(); map.zoomAt(rect.width/2,rect.height/2,Math.max(map.view.zoom/1.2,.72)); } });
  $('#reset-view').addEventListener('click', () => map?.home());

  const canvas = $('#terrain-canvas');
  canvas.addEventListener('pointerdown', event => {
    if (!map) return;
    drag = {x:event.clientX, y:event.clientY, lon:map.view.lon, lat:map.view.lat};
    canvas.setPointerCapture(event.pointerId); canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!map) return;
    const bounds=canvas.getBoundingClientRect();
    map.setPointer(event.clientX-bounds.left,event.clientY-bounds.top);
    if (drag) {
      map.view.lon = normalizeLon(drag.lon - (event.clientX - drag.x) / bounds.width * 360 / map.view.zoom);
      map.view.lat = Math.max(-88, Math.min(88, drag.lat + (event.clientY - drag.y) / bounds.height * 180 / map.view.zoom));
      map.draw();
    }
  });
  canvas.addEventListener('pointerleave', () => map?.clearPointer());
  const stopDrag = () => { drag = null; canvas.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', stopDrag); canvas.addEventListener('pointercancel', stopDrag);
  $('#map').addEventListener('wheel', event => {
    event.preventDefault();
    if (!map) return;
    const rect = canvas.getBoundingClientRect(), point = {x:event.clientX - rect.left, y:event.clientY - rect.top};
    const nextZoom = Math.max(.72, Math.min(16, map.view.zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
    map.zoomAt(point.x,point.y,nextZoom);
  }, {passive:false});
  window.addEventListener('resize', () => map?.draw());

  $('#total-stat').textContent = String(records.moon.length).padStart(2, '0');
  document.querySelector('.stat:nth-child(1) span').textContent = 'Ay görev bölgesi';
  document.body.dataset.world = world;
  $('#mini-world-label').textContent = 'MOON / EQ';
  $('#mini-planet-count').textContent = `${String(records.moon.length).padStart(2, '0')} KAYIT`;
  document.querySelectorAll('.world-option').forEach(button => {
    const key = button.dataset.world;
    button.querySelector('small').textContent = `${key === 'moon' ? 'MOON' : 'MARS'} · ${String(records[key].length).padStart(2, '0')} KAYIT`;
  });
  $('#map-title').textContent = worlds.moon.title; $('#layer-name').textContent = worlds.moon.layer;
  $('#oldest-stat').textContent = worlds.moon.oldest;
  $('#timeline-range').textContent = `${worlds.moon.oldest} — ${worlds.moon.last}`;
  document.querySelector('.stat:nth-child(2) span').textContent = worlds.moon.oldestName;
  selected = records.moon[0].id;$('#toolbar-record-count').textContent=String(records.moon.length).padStart(2,'0');buildLunarPhaseMarks();applyLanguage();renderList();const introPromise=runMoonPhaseJourney();initMap(introPromise);
})();
