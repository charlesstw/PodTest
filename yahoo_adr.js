"use strict";
! function() {
    var a = function(a) {
            var b = [];
            if (a) try {
                var c = JSON.parse(a);
                if (c)
                    for (var d in c) c.hasOwnProperty(d) && b.push(d + '="' + c[d] + '"')
            } catch (e) {}
            return b.join(" ")
        },
        b = "",
        c = window.yadData;
    c && c.sa && (b = a(c.sa));
    var d = ["https://us.adserver.yahoo.com/a?", "f=", 
            c.sid, "&p=", c.site, "&at=", encodeURIComponent(b), "&l=LREC&c=hm&bg=white"].join(""),
        e = document.createElement("iframe");
    e.setAttribute("scrolling", "no"), e.setAttribute("frameborder", "0"), 
    e.setAttribute("allowtransparency", "true"), e.setAttribute("src", d), 
    e.setAttribute("style", "height:100%;width:100%;border:none;position:absolute"), 
    document.body.appendChild(e)
}();
