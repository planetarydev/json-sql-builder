'use strict'

// https://css-tricks.com/snippets/javascript/get-url-variables/
function queryString(variable){
    try{
        var q = location.search.substring(1);
        var v = q.split("&");
        for( var i = 0; i < v.length; i++ ){
            var p = v[i].split("=");
            if( p[0] == variable ){
                if( p[1].indexOf('%20') != -1 ){
                    return decodeURIComponent(p[1]);
                }
                else{
                    return p[1];
                }
            }
        }
    }
    catch (e){
        console.log(e);
    }
}

// Open and close the sidenav on medium and small screens
function openSidenav() {
    document.getElementById("sidenavMenu").style.display = "block";
    document.getElementById("sidenavOverlay").style.display = "block";
}
function closeSidenav() {
    document.getElementById("sidenavMenu").style.display = "none";
    document.getElementById("sidenavOverlay").style.display = "none";
}

function closeDropSearch(){
    document.getElementById("dropSearch").style.display = "none";
}
function openDropSearch(){
    document.getElementById("dropSearch").style.display = "block";
}

function goTo(file, hash){
    location.replace(file + '?s=' + encodeURIComponent($('#searchInput').val()) + '#' + hash);
}

var lastId;

// Change style of top container on scroll
window.onscroll = function() {
    if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
        document.getElementById("topHeader").classList.add("w3-card-4", "w3-animate-opacity");
        document.getElementById("titleSmall").classList.add("w3-show-inline-block");
    } else {
        document.getElementById("titleSmall").classList.remove("w3-show-inline-block");
        document.getElementById("topHeader").classList.remove("w3-card-4", "w3-animate-opacity");
    }

    // minimalistic scrollspy implementation
    // Get container scroll position
    var menuItems = $('#menuScrollArea').find("a");
    var scrollItems = menuItems.map(function(){
          var item = $($(this).attr("href"));
          if (item.length) { return item; }
    });

    var fromTop = $(this).scrollTop() + 80;

    // Get id of current scroll item
    var cur = scrollItems.map(function(){
      if ($(this).offset().top < fromTop)
        return this;
    });
    // Get the id of the current element
    cur = cur[cur.length-1];
    var id = cur && cur.length ? cur[0].id : "";

    if (lastId !== id) {
        lastId = id;
        // Set/remove active class
        menuItems.removeClass('scroll-active');
        $('a[href="#' + id + '"]').addClass('scroll-active');
    }
};

function getStyleRuleValue(style, selector, sheet) {
    var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
    for (var i = 0, l = sheets.length; i < l; i++) {
        var sheet = sheets[i];
        if( !sheet.cssRules ) { continue; }
        for (var j = 0, k = sheet.cssRules.length; j < k; j++) {
            var rule = sheet.cssRules[j];
            if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) {
                return rule.style[style];
            }
        }
    }
    return null;
}

$(document).ready(function(){
    // generate addition theme style for scroll-active class --> color
    $(document.body).append('<span id="theme-color-detection-l4" class="w3-theme-l4"></span>');
    $(document.body).append('<span id="theme-color-detection-d4" class="w3-theme-d4"></span>');
    $('<style>')
        .prop('type', 'text/css')
        .html('.menu-item.scroll-active, .menu-item.depth-0.active, .menu-item.depth-1.active {color: ' + $('#theme-color-detection-d4').css('background-color') + ' !important;}')
        .appendTo("head");
    $('<style>')
        .prop('type', 'text/css')
        .html('code {color: ' + $('#theme-color-detection-l4').css('color') + '; background-color: ' + $('#theme-color-detection-l4').css('background-color') + ';}')
        .appendTo("head");

    var scrollHeight = window.innerHeight - $('#brand-sidenav').height();
    $('#menuScrollArea').slimScroll({
        height:  scrollHeight + 'px'
    });

    hljs.initHighlightingOnLoad();
    hljs.initLineNumbersOnLoad();

    // don't add this class directly into the html, because on loading the page, after rendering
    // the sidebar will animated from left
    $('#sidenavmenu').addClass('w3-animate-left');

    $('#scrollAreaSearchResults').slimScroll({
        height: '450px'
    });

    // set a possible search-value from the last search to the input
    $('#searchInput').val(queryString('s'));

    // attach an event handler on input to search for the input value
    $('#searchInput').on('input', function(event){
        var value = this.value,
            htmlResults = '';
        var results = docs.filter(function(el){
            return  el.summary.indexOf(value) > -1 ||
                    el.name.indexOf(value) > -1 ||
                    el.longname.indexOf(value) > -1 ||
                    (el.after && el.after.indexOf(value) > -1) ||
                    (el.before && el.before.indexOf(value) > -1);
        });

        if (value != '') {
            // remove the old search-results
            $('#scrollAreaSearchResults').find('ul.w3-ul').remove();
            if (results.length == 0){
                htmlResults +=
                    '<li class="w3-padding-16">' +
                        '<span class="w3-large">' + 'Sorry, nothing found.' + '</span><br>' +
                        '<span class="w3-medium"></span>' +
                    '</li>'
            }
            // and add the new again
            for (var i=0, max=results.length; i<max; i++) {
                var doc = results[i];
                htmlResults +=
                    '<li class="w3-padding-16 w3-hover-theme">' +
                        '<a href="#" class="searchresult-link" onclick="goTo(\'' + doc.category + '-' + doc.depth0 + '.html' + '\', \'' + doc.hashId + '\')">' +
                            '<span class="w3-large">' + doc.longname + '</span><br>' +
                            '<span class="w3-medium">' + doc.summary + '</span>' +
                        '</a>' +
                    '</li>';
            }
            $('#scrollAreaSearchResults').append('<ul class="w3-ul">' + htmlResults + '</ul>');
            openDropSearch();
        }
        else
            closeDropSearch();
    });
});
