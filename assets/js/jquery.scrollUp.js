(function ($, window, document) {
  "use strict";
  $.fn.scrollUp = function (options) {
    if (!$.data(document.body, "scrollUp")) {
      $.data(document.body, "scrollUp", true);
      $.fn.scrollUp.init(options);
    }
  };
  $.fn.scrollUp.init = function (options) {
    var o = ($.fn.scrollUp.settings = $.extend(
        {},
        $.fn.scrollUp.defaults,
        options
      )),
      triggerVisible = false,
      animIn,
      animOut,
      animSpeed,
      scrollDis,
      scrollEvent,
      scrollTarget,
      $self;
    if (o.scrollTrigger) {
      $self = $(o.scrollTrigger);
    } else {
      $self = $("<a/>", { id: o.scrollName, href: "#top" });
    }
    if (o.scrollTitle) {
      $self.attr("title", o.scrollTitle);
    }
    $self.appendTo("body");
    if (!(o.scrollImg || o.scrollTrigger)) {
      $self.html(o.scrollText);
    }
    $self.css({ display: "none", position: "fixed", zIndex: o.zIndex });
    if (o.activeOverlay) {
      $("<div/>", { id: o.scrollName + "-active" })
        .css({
          position: "absolute",
          top: o.scrollDistance + "px",
          width: "100%",
          borderTop: "1px dotted" + o.activeOverlay,
          zIndex: o.zIndex,
        })
        .appendTo("body");
    }
    switch (o.animation) {
      case "fade":
        animIn = "fadeIn";
        animOut = "fadeOut";
        animSpeed = o.animationSpeed;
        break;
      case "slide":
        animIn = "slideDown";
        animOut = "slideUp";
        animSpeed = o.animationSpeed;
        break;
      default:
        animIn = "show";
        animOut = "hide";
        animSpeed = 0;
    }
    if (o.scrollFrom === "top") {
      scrollDis = o.scrollDistance;
    } else {
      scrollDis = $(document).height() - $(window).height() - o.scrollDistance;
    }
    scrollEvent = $(window).scroll(function () {
      if ($(window).scrollTop() > scrollDis) {
        if (!triggerVisible) {
          $self[animIn](animSpeed);
          triggerVisible = true;
        }
      } else {
        if (triggerVisible) {
          $self[animOut](animSpeed);
          triggerVisible = false;
        }
      }
    });
    if (o.scrollTarget) {
      if (typeof o.scrollTarget === "number") {
        scrollTarget = o.scrollTarget;
      } else if (typeof o.scrollTarget === "string") {
        scrollTarget = Math.floor($(o.scrollTarget).offset().top);
      }
    } else {
      scrollTarget = 0;
    }
    $self.click(function (e) {
      e.preventDefault();
      $("html, body").animate(
        { scrollTop: scrollTarget },
        o.scrollSpeed,
        o.easingType
      );
    });
  };
  $.fn.scrollUp.defaults = {
    scrollName: "scrollUp",
    scrollDistance: 300,
    scrollFrom: "top",
    scrollSpeed: 300,
    easingType: "linear",
    animation: "fade",
    animationSpeed: 200,
    scrollTrigger: false,
    scrollTarget: false,
    scrollText: "Scroll to top",
    scrollTitle: false,
    scrollImg: false,
    activeOverlay: false,
    zIndex: 2147483647,
  };
  $.fn.scrollUp.destroy = function (scrollEvent) {
    $.removeData(document.body, "scrollUp");
    $("#" + $.fn.scrollUp.settings.scrollName).remove();
    $("#" + $.fn.scrollUp.settings.scrollName + "-active").remove();
    if ($.fn.jquery.split(".")[1] >= 7) {
      $(window).off("scroll", scrollEvent);
    } else {
      $(window).unbind("scroll", scrollEvent);
    }
  };
  $.scrollUp = $.fn.scrollUp;
})(jQuery, window, document);
