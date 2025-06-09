document.addEventListener('DOMContentLoaded', function() {

// Definisikan koordinat Home - Sesuaikan sesuai lokasi Anda
// Contoh: Koordinat pusat Kota Garut
const homeCoordinates = { lat: -7.2167, lng: 107.9250, zoom: 13 };

  // Inisialisasi peta - Pastikan ID 'map' sesuai dengan id div di HTML
  const map = L.map('map').setView([homeCoordinates.lat, homeCoordinates.lng], homeCoordinates.zoom);

  // --- Basemap Layers ---
  const basemapOSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  const baseMapGoogle = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Map by <a href="https://maps.google.com/">Google</a>',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  });

  const baseMapSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Satellite by <a href="https://maps.google.com/">Google</a>',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  });

  // Tambahkan salah satu basemap secara default
  basemapOSM.addTo(map);

  // Daftar semua pilihan basemap
  const baseMaps = {
      "OpenStreetMap": basemapOSM,
      "Google Maps": baseMapGoogle,
      "Google Satellite": baseMapSatellite
  };

  // --- Overlay Layers ---
  let kawasanRawanLayer; // Variabel untuk lapisan Kawasan Rawan Bencana (original)
  let radiusKawasanRawanLayer; // Variabel untuk lapisan Radius Kawasan Rawan Bencana (baru)
  const overlayMaps = {}; // Objek untuk menyimpan lapisan overlay

  // Fungsi untuk mendapatkan warna berdasarkan atribut 'INDGA' (nilai 1, 2, 3) untuk KAWASAN Rawan Bencana
  function getKawasanRawanStyle(feature) {
      let indgaValue = feature.properties.INDGA; 
      let fillColor;

      switch (indgaValue) {
          case 1: 
              fillColor = '#00e400'; // Hijau (Risiko Rendah)
              break;
          case 2: 
              fillColor = '#ffff00'; // Kuning (Risiko Sedang)
              break;
          case 3: 
              fillColor = '#ff0000'; // Merah (Risiko Tinggi)
              break;
          default:
              fillColor = '#808080'; // Abu-abu
      }

      return {
          fillColor: fillColor,
          weight: 2,           
          opacity: 1,          
          color: 'white',      
          dashArray: '',       
          fillOpacity: 0.7     
      };
  }

  // Fungsi untuk mendapatkan warna berdasarkan atribut 'INDGA' (nilai 1, 2, 3) untuk RADIUS Kawasan Rawan Bencana
  function getRadiusKawasanRawanStyle(feature) {
      let indgaValue = feature.properties.INDGA; 
      let fillColor;

      switch (indgaValue) {
          case 1: 
              fillColor = '#00e400'; // Hijau (Risiko Rendah)
              break;
          case 2: 
              fillColor = '#ffff00'; // Kuning (Risiko Sedang)
              break;
          case 3: 
              fillColor = '#ff0000'; // Merah (Risiko Tinggi)
              break;
          default:
              fillColor = '#808080'; // Abu-abu
      }

      return {
          fillColor: fillColor,
          weight: 2,           
          opacity: 1,          
          color: 'white',      
          dashArray: '',       
          fillOpacity: 0.7     
      };
  }


  // --- Memuat data GeoJSON Kawasan+Rawan.geojson ---
  fetch('spasial/Kawasan+Rawan.geojson')
      .then(response => {
          if (!response.ok) {
              throw new Error('Gagal memuat GeoJSON Kawasan Rawan: ' + response.statusText);
          }
          return response.json();
      })
      .then(geojson_data => {
          console.log('Data GeoJSON Kawasan Rawan berhasil dimuat:', geojson_data);

          kawasanRawanLayer = L.geoJSON(geojson_data, {
              style: getKawasanRawanStyle, // Gunakan fungsi styling untuk Kawasan Rawan
              onEachFeature: function(feature, layer) {
                  if (feature.properties) {
                      let popupContent = `<h4>Kawasan Rawan Bencana</h4>`;
                      for (let key in feature.properties) {
                          popupContent += `<b>${key}:</b> ${feature.properties[key]}<br>`;
                      }
                      layer.bindPopup(popupContent);
                  }

                  layer.on({
                      mouseover: function(e) { e.target.setStyle({ weight: 5, color: '#666', dashArray: '', fillOpacity: 0.9 }); if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) { e.target.bringToFront(); } },
                      mouseout: function(e) { kawasanRawanLayer.resetStyle(e.target); }
                  });
              }
          });

          overlayMaps["Kawasan Rawan Bencana"] = kawasanRawanLayer;

          // Tambahkan ke layer control jika sudah siap
          if (layerControl) {
              layerControl.addOverlay(kawasanRawanLayer, "Kawasan Rawan Bencana");
          }
          // Opsional: Langsung tambahkan layer ini ke peta saat dimuat
          kawasanRawanLayer.addTo(map);

      })
      .catch(error => {
          console.error('Ada kesalahan saat memuat atau memproses GeoJSON Kawasan Rawan:', error);
      });

  // --- Memuat data GeoJSON Radius+Kawasan+Rawan.geojson ---
  // !!! INI ADALAH BLOK TAMBAHAN UNTUK FILE KEDUA !!!
  fetch('spasial/Radius+Kawasan+Rawan.geojson') // Pastikan path ini benar!
      .then(response => {
          if (!response.ok) {
              throw new Error('Gagal memuat GeoJSON Radius Kawasan Rawan: ' + response.statusText);
          }
          return response.json();
      })
      .then(geojson_data => {
          console.log('Data GeoJSON Radius Kawasan Rawan berhasil dimuat:', geojson_data);

          radiusKawasanRawanLayer = L.geoJSON(geojson_data, {
              style: getRadiusKawasanRawanStyle, // Gunakan fungsi styling untuk Radius Kawasan Rawan
              onEachFeature: function(feature, layer) {
                  if (feature.properties) {
                      let popupContent = `<h4>Info Radius Kawasan Rawan Bencana</h4>`;
                      for (let key in feature.properties) {
                          popupContent += `<b>${key}:</b> ${feature.properties[key]}<br>`;
                      }
                      layer.bindPopup(popupContent);
                  }

                  layer.on({
                      mouseover: function(e) { e.target.setStyle({ weight: 5, color: '#666', dashArray: '', fillOpacity: 0.9 }); if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) { e.target.bringToFront(); } },
                      mouseout: function(e) { radiusKawasanRawanLayer.resetStyle(e.target); }
                  });
              }
          });

          // Tambahkan lapisan GeoJSON ke objek overlayMaps
          overlayMaps["Radius Kawasan Rawan Bencana"] = radiusKawasanRawanLayer;

          // Tambahkan ke layer control jika sudah siap
          if (layerControl) {
              layerControl.addOverlay(radiusKawasanRawanLayer, "Radius Kawasan Rawan Bencana");
          }
          // Opsional: Langsung tambahkan layer ini ke peta saat dimuat
          // radiusKawasanRawanLayer.addTo(map); // Anda bisa memilih untuk tidak mengaktifkan ini secara default

      })
      .catch(error => {
          console.error('Ada kesalahan saat memuat atau memproses GeoJSON Radius Kawasan Rawan:', error);
      });


  // --- Layer Control (Basemap & Overlays) ---
  // Inisialisasi Layer Control. Penting: Pastikan ini dideklarasikan setelah overlayMaps didefinisikan.
  // Jika GeoJSON dimuat secara async, layer akan ditambahkan via addOverlay() nanti.
  let layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);


  // --- Custom Controls ---
  // Tombol "Home"
  const homeControl = L.control({ position: 'topleft' });
  homeControl.onAdd = function(mapInstance) {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      div.innerHTML = '🏠'; // Ikon rumah
      div.style.backgroundColor = 'white';
      div.style.width = '30px';
      div.style.height = '30px';
      div.style.lineHeight = '30px';
      div.style.fontSize = '20px';
      div.style.textAlign = 'center';
      div.style.cursor = 'pointer';
      div.title = 'Kembali ke Home';
      div.onclick = function() {
          mapInstance.setView([homeCoordinates.lat, homeCoordinates.lng], homeCoordinates.zoom);
      };
      return div;
  };
  homeControl.addTo(map);

  // Fitur "My Location"
  L.control.locate({
      position: 'topleft',
      flyTo: true,
      strings: {
          title: "Temukan lokasiku"
      },
      locateOptions: {
          enableHighAccuracy: true
      }
  }).addTo(map);

  // Tombol Fullscreen
  const fullscreenControl = L.control({ position: 'topleft' });
  fullscreenControl.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      div.innerHTML = '⛶'; // Ikon fullscreen
      div.style.backgroundColor = 'white';
      div.style.width = '30px';
      div.style.height = '30px';
      div.style.lineHeight = '30px';
      div.style.textAlign = 'center';
      div.style.cursor = 'pointer';
      div.title = 'Fullscreen';

      div.onclick = function() {
          const mapContainer = map.getContainer();
          if (!document.fullscreenElement &&
              !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
              if (mapContainer.requestFullscreen) { mapContainer.requestFullscreen(); }
              else if (mapContainer.mozRequestFullScreen) { mapContainer.mozRequestFullScreen(); }
              else if (mapContainer.webkitRequestFullscreen) { mapContainer.webkitRequestFullscreen(); }
              else if (mapContainer.msRequestFullscreen) { mapContainer.msRequestFullscreen(); }
          } else {
              if (document.exitFullscreen) { document.exitFullscreen(); }
              else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
              else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
              else if (document.msExitFullscreen) { document.msExitFullscreen(); }
          }
      };
      return div;
  };
  fullscreenControl.addTo(map);

  // Menangani event perubahan fullscreen untuk memperbarui ukuran peta
  document.addEventListener('fullscreenchange', () => map.invalidateSize());
  document.addEventListener('webkitfullscreenchange', () => map.invalidateSize());
  document.addEventListener('mozfullscreenchange', () => map.invalidateSize());
  document.addEventListener('MSFullscreenChange', () => map.invalidateSize());

  // --- Logika Tombol Kontrol Kustom (Stasiun Kualitas Udara, Kebakaran, dll.) ---
  document.querySelectorAll('.map-control-button').forEach(button => {
      button.addEventListener('click', function() {
          this.classList.toggle('active');
          // Logika untuk menampilkan/menyembunyikan lapisan lain dapat ditambahkan di sini
      });
  });

  // Variabel symbologyPoint (Jika Anda memiliki layer point yang akan menggunakan ini)
  var symbologyPoint = {
      radius: 5,
      fillColor: "#9dfc03",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
  };

}); // Akhir dari DOMContentLoaded