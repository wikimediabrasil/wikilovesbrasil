////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MAP LAYER
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let map = L.map('map', {zoomControl: false}).setMaxBounds([[10, -20], [-40, -90]]);

// OpenStreetMap
let osm_map = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 4,
    attribution: credits_osm
})

// Wikimedia
const wm_map = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 4,
    attribution: credits_wikimedia
}).addTo(map);

// Making map fit to the state
map.fitBounds(bounds);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ICONS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let greenIcon = L.AwesomeMarkers.icon({
    icon: 'fa-solid fa-image',
    markerColor: 'green',
    iconColor: 'white',
    prefix: 'fas'
});

let greenblueIcon = L.AwesomeMarkers.icon({
    icon: 'fa-solid fa-image',
    markerColor: 'darkblue',
    iconColor: 'white',
    prefix: 'fas'
});

let redIcon = L.AwesomeMarkers.icon({
    icon: 'fa-camera',
    markerColor: 'red',
    iconColor: 'white',
    prefix: 'fa'
});

let redblueIcon = L.AwesomeMarkers.icon({
    icon: 'fa-camera',
    markerColor: 'darkblue',
    iconColor: 'white',
    prefix: 'fa'
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CLUSTERS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let markers_with_image = L.markerClusterGroup({
    maxClusterRadius: 100,
    disableClusteringAtZoom: 15,
    showCoverageOnHover: false,
    iconCreateFunction: function (cluster) {
        var markers = cluster.getAllChildMarkers();
        if (markers.length < 10) {
            return L.divIcon({
                html: '<div class="green-cluster green-circle-tiny">' + markers.length + '</div>',
                iconSize: L.point(20, 20)
            });
        } else if (markers.length < 25) {
            return L.divIcon({
                html: '<div class="green-cluster green-circle-small">' + markers.length + '</div>',
                iconSize: L.point(25, 25)
            });
        } else if (markers.length < 50) {
            return L.divIcon({
                html: '<div class="green-cluster green-circle-normal">' + markers.length + '</div>',
                iconSize: L.point(30, 30)
            });
        } else if (markers.length < 250) {
            return L.divIcon({
                html: '<div class="green-cluster green-circle-big">' + markers.length + '</div>',
                iconSize: L.point(35, 35)
            });
        } else {
            return L.divIcon({
                html: '<div class="green-cluster green-circle-large">' + markers.length + '</div>',
                iconSize: L.point(40, 40)
            });
        }
    }
});

let markers_without_image = L.markerClusterGroup({
    maxClusterRadius: 100,
    disableClusteringAtZoom: 15,
    showCoverageOnHover: false,
    iconCreateFunction: function (cluster) {
        var markers = cluster.getAllChildMarkers();
        if (markers.length < 10) {
            return L.divIcon({
                html: '<div class="red-cluster red-circle-tiny">' + markers.length + '</div>',
                iconSize: L.point(20, 20)
            });
        } else if (markers.length < 25) {
            return L.divIcon({
                html: '<div class="red-cluster red-circle-small">' + markers.length + '</div>',
                iconSize: L.point(25, 25)
            });
        } else if (markers.length < 50) {
            return L.divIcon({
                html: '<div class="red-cluster red-circle-normal">' + markers.length + '</div>',
                iconSize: L.point(30, 30)
            });
        } else if (markers.length < 250) {
            return L.divIcon({
                html: '<div class="red-cluster red-circle-big">' + markers.length + '</div>',
                iconSize: L.point(35, 35)
            });
        } else {
            return L.divIcon({
                html: '<div class="red-cluster red-circle-large">' + markers.length + '</div>',
                iconSize: L.point(40, 40)
            });
        }
    }
});

// Adding elements to the map
markers_with_image.addTo(map);

markers_without_image.addTo(map);

let all_markers = L.layerGroup([markers_with_image, markers_without_image])

// Subgroup for the selected items
let markers_selected = L.featureGroup.subGroup();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BUTTONS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // Menu
// L.easyButton({
//     states: [{
//         icon: "<i class='fa-solid fa-bars'></i> ",
//         stateName: 'menu',
//         onClick: function () {
//             $('#presentationModal').modal('show');
//         }
//     }]
// }).addTo(map);

// Zoom
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Locate
let locate = L.control.locate({
    flyTo: true,
    position: 'bottomright',
    returnToPrevBounds: true,
    icon: 'locate fa-solid fa-location-dot',
    iconElementTag: 'i',
    strings: {
        title: whereAmIMsg
    },
}).addTo(map);

// Layers
L.control.layers({"OpenStreetMap": osm_map, "Wikimedia": wm_map}, null, {position: 'bottomright', icon: 'fa-light fa-layer-group'}).addTo(map);

// Search
let search_button = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function(map) {
        let container = L.DomUtil.create('div', 'leaflet-bar leaflet-control search-container');
        let inputField = L.DomUtil.create('input', 'form-control search-input', container);
        let resultsList = L.DomUtil.create('div', 'list-group', container);

        inputField.type = 'search';
        inputField.placeholder = instruction;
        inputField.ariaLabel = searchString;

        L.DomEvent.disableClickPropagation(container);

        L.DomEvent.addListener(inputField, 'keyup', function (e) {
            switch (e.keyCode) {
                case 27:
                // case 38:
                // case 40:
                case 45:
                case 46:
                case 37:
                case 39:
                case 16:
                case 17:
                case 35:
                case 36:
                    break;
                default:
                    if (this.value.length >= 3) {
                        resultsList.innerHTML = "";
                        let searchString = this.value.toLowerCase();
                        all_markers.eachLayer(function (clusterlayer) {
                            clusterlayer.eachLayer(function (layer) {
                                if (layer.options && (layer.options.item.toLowerCase().includes(searchString) || layer.options.label.toLowerCase().includes(searchString))) {
                                    var a = L.DomUtil.create('a', 'list-group-item');
                                    a.href = '';
                                    a.setAttribute('data-result-name', layer.options.label.toLowerCase());
                                    a.setAttribute('data-result-qid', layer.options.item.toLowerCase());
                                    a.innerHTML = layer.options.label + " (" + layer.options.item + ")";
                                    a.onclick = function (e) {
                                        e.preventDefault();
                                        map.setView(layer._latlng, 19);
                                        resultsList.innerHTML = "";
                                    }
                                    resultsList.appendChild(a);

                                    return a;
                                }
                            });
                        });
                    } else {
                        resultsList.innerHTML = "";
                    }
            }
        });

        return container;
        },
});
map.addControl(new search_button());

// Home
L.easyButton("<i class='fa-solid fa-house'></i>", function () { window.open(home_url, '_self'); }, homeTooltip).addTo(map);

// Language
L.easyButton("<i class='fa-solid fa-language'></i>", function () { $('#langModal').modal('show'); }, langTooltip).addTo(map);

// Group/Ungroup
L.easyButton({
    states: [
        {
            icon: "<i class='fa-solid fa-object-ungroup'></i>",
            stateName: 'grouped',
            width: '100%',
            title: ungroupTooltip,
            onClick: function (btn, map) {
                btn.state('ungrouped');
                markers_with_image.freezeAtZoom("max");
                markers_without_image.freezeAtZoom("max");
            }
        },
        {
            icon: "<i class='fa-solid fa-object-group'></i>",
            stateName: 'ungrouped',
            width: '100%',
            title: groupTooltip,
            onClick: function (btn) {
                btn.state('grouped');
                markers_with_image.freezeAtZoom(false);
                markers_without_image.freezeAtZoom(false);
            }
        }
    ]
}).addTo(map);

// Filter
L.easyButton({
    states: [
        {
            icon: "<i class='fa-solid fa-filter'></i>",
            stateName: 'filter',
            width: '100%',
            title: filterTooltip,
            onClick: function (btn, map) {
                $('#filterModal').modal('show');
            }
        }]
}).addTo(map);

// Save Selection
let saveSelectButton = L.easyButton({
    states: [
        {
            icon: "<i class='fa-solid fa-download'></i>",
            stateName: 'saveselect',
            width: '100%',
            display: 'none',
            title: selectTooltip,
            onClick: function (btn, map) {
                let selectedMarkers = [];
                markers_selected.getLayers().forEach(function (marker) {
                    const match = marker.getPopup().getContent().match(/.*(Q\d+).*/);
                    selectedMarkers.push(match[1]);
                });
                $.ajax({
                    url: "/print_selection",
                    type: "POST",
                    data: JSON.stringify({"items": selectedMarkers}),
                    contentType: "application/json",
                    dataType: "json",

                    success: function (response) {
                        var uri = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(response);
                        var link = document.createElement('a');
                        link.download = 'route.csv';
                        link.href = uri;

                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    },
                    error: function (response) {
                        alert("Error");
                    }
                });
            }
        }
    ]
});

// Select
let toggle_select = false;

L.easyButton({
    states: [
        {
            icon: "<i class='fa-solid fa-map-location-dot'></i>",
            stateName: 'select',
            width: '100%',
            title: selectTooltip,
            onClick: function (btn, map) {
                btn.state('unselect');
                toggle_select = !toggle_select;
                saveSelectButton.addTo(map);
            }
        },
        {
            icon: "<i class='fa-solid fa-map-location-dot''></i>",
            stateName: 'unselect',
            width: '100%',
            title: unselectTooltip,
            onClick: function (btn, map) {
                btn.state('select');
                markers_selected.eachLayer(function (marker) {
                    if (marker.getIcon() === greenblueIcon) {
                        marker.setIcon(greenIcon);
                    } else if (marker.getIcon() === redblueIcon) {
                        marker.setIcon(redIcon);
                    }
                });
                toggle_select = !toggle_select;
                saveSelectButton.remove();
            }
        },
    ]
}).addTo(map);

// Geocoordinates
L.easyButton('<i class="fa-solid fa-globe"></i>', function () { window.open(coordinates_url, '_self'); }, coordinatesTooltip).addTo(map);

// Suggest
L.easyButton('<i class="fa-solid fa-comment-dots"></i>', function () { window.open(suggestions_url, '_self'); }, suggestionsTooltip).addTo(map);

// Info
L.easyButton('<i class="fa-solid fa-info"></i>', function () { $('#aboutModal').modal('show'); }, infoTooltip).addTo(map);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS AND ACTIONS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function of each marker to change it when selected for making a route
function markerOnClick(e) {
    if (toggle_select) {
        e.target.closePopup();
        if (e.target.getIcon() === greenIcon) {
            e.target.setIcon(greenblueIcon);
            e.target.addTo(markers_selected);
        } else if (e.target.getIcon() === greenblueIcon) {
            e.target.setIcon(greenIcon);
            e.target.removeFrom(markers_selected);
        } else if (e.target.getIcon() === redIcon) {
            e.target.setIcon(redblueIcon);
            e.target.addTo(markers_selected);
        } else {
            e.target.setIcon(redIcon);
            e.target.removeFrom(markers_selected);
        }
        map.removeLayer(markers_selected);
    } else {}
}

// Removal of all layers and addition of selected layer. Has image and is of type target_layer
function removeOtherLayers(target_layer) {
    $.each([P1766, P18, P1801, P3311, P3451, P4291, P5775, P8517, P8592, P9721, P9906], function (index, layer) {
        map.removeLayer(layer);
    });
    map.addLayer(target_layer);
    let layerBounds = target_layer.getBounds();
    if (layerBounds.isValid()) { map.fitBounds(layerBounds, {padding: [20, 20]}); }
}

// Addition of all layers and removal of selected layer. Has no image of type target_layer
function removeThisLayer(target_layer) {
    $.each([P1766, P18, P1801, P3311, P3451, P4291, P5775, P8517, P8592, P9721, P9906], function (index, layer) {
        map.addLayer(layer);
    });
    map.removeLayer(target_layer);
}

// Filter function
$('#filter').on('click', function (event) {
    let has_image = $('#has_image').val(); // HAS IMAGE
    let types = $('#types').val(); // TYPES

    if (has_image === "yes") {
        map.removeLayer(markers_without_image);
        map.addLayer(markers_with_image);
        if (types === "all") {$.each([P1766, P18, P1801, P3311, P3451, P4291, P5775, P8517, P8592, P9721, P9906], function (index, layer) {map.addLayer(layer);});}
        else if (types === "P1766") {removeOtherLayers(P1766);}
        else if (types === "P18") {removeOtherLayers(P18);}
        else if (types === "P1801") {removeOtherLayers(P1801);}
        else if (types === "P3311") {removeOtherLayers(P3311);}
        else if (types === "P3451") {removeOtherLayers(P3451);}
        else if (types === "P4291") {removeOtherLayers(P4291);}
        else if (types === "P5775") {removeOtherLayers(P5775);}
        else if (types === "P8517") {removeOtherLayers(P8517);}
        else if (types === "P8592") {removeOtherLayers(P8592);}
        else if (types === "P9721") {removeOtherLayers(P9721);}
        else if (types === "P9906") {removeOtherLayers(P9906);}
    } else if (has_image === "no") {
        map.addLayer(markers_without_image);
        map.removeLayer(markers_with_image);
        if (types === "all") {$.each([P1766, P18, P1801, P3311, P3451, P4291, P5775, P8517, P8592, P9721, P9906], function (index, layer) {map.removeLayer(layer);});}
        else if (types === "P1766") {removeThisLayer(P1766);}
        else if (types === "P18") {removeThisLayer(P18);}
        else if (types === "P1801") {removeThisLayer(P1801);}
        else if (types === "P3311") {removeThisLayer(P3311);}
        else if (types === "P3451") {removeThisLayer(P3451);}
        else if (types === "P4291") {removeThisLayer(P4291);}
        else if (types === "P5775") {removeThisLayer(P5775);}
        else if (types === "P8517") {removeThisLayer(P8517);}
        else if (types === "P8592") {removeThisLayer(P8592);}
        else if (types === "P9721") {removeThisLayer(P9721);}
        else if (types === "P9906") {removeThisLayer(P9906);}
    } else {
        map.addLayer(markers_without_image);
        map.addLayer(markers_with_image);
        $.each([P1766, P18, P1801, P3311, P3451, P4291, P5775, P8517, P8592, P9721, P9906, markers_without_image], function (index, layer) {
            map.addLayer(layer);
        });
    }

    let layerBounds = layer_to_preserve.getBounds();
            if (layerBounds.isValid()) {
                map.fitBounds(layerBounds, {padding: [20, 20]});
            }

    has_image_filtered = has_image;
    types_filtered = types;
});

// Update of form fields
$('#has_image').on('change', function () {
    if (this.value === "all") {
        $('#types').prop("disabled", true);
    } else if (this.value === "no") {
        $('#types').prop("disabled", false);
        $("#types option[value='all']").text(noTypeTitle);
    } else {
        $('#types').prop("disabled", false);
        $("#types option[value='all']").text(allTypesTitle);
    }
    $('#types option[value="select"]').prop("selected", true);
});

// Create subgroups
let P1766 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P18 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P1801 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P3311 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P3451 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P4291 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P5775 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P8517 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P8592 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P9721 = L.featureGroup.subGroup(markers_with_image).addTo(map),
    P9906 = L.featureGroup.subGroup(markers_with_image).addTo(map);

// Helper functions to make HTML smaller
const wlmMarkerTranslations = {
  pt_br: "Ver mais informações e enviar fotografias",
  pt: "Ver mais informações e enviar fotografias",
  en: "See more information and send photos",
  nl: "Bekijk meer informatie en stuur foto's"
};

const verTexto = wlmMarkerTranslations[lang] || wlmMarkerTranslations.pt_br;

const WlmMarker = (id, lon, lat, icon, label, layers_str = []) => {
  const m = L.marker({lon, lat}, {icon, item: id, label})
    .bindTooltip(label, {direction: 'top', offset: [0, -37]})
    .bindPopup(
      `<span style='text-align:center'><b>${label}</b></span><br><br>` +
      `<a class='custom-link' target='_self' href='/monument/${id}'>` +
      `<button class='send_button'>` +
      `<i class='fa-solid fa-arrow-up-from-bracket'></i> ` +
      `${verTexto}</div>`,
      {closeButton: false}
    )
    .on('click', markerOnClick);
  layers_str.forEach(l => m.addTo(l));
};
