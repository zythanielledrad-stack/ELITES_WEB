(function ($) {

  $(document).ready(function () {

    $('body').addClass('js');

    var $menu = $('#menu'),
        $menulink = $('.menu-link');

    // MENU TOGGLE
    $menulink.click(function () {
      $menulink.toggleClass('active');
      $menu.toggleClass('active');
      return false;
    });

    // VIDEO POPUP SAFE CHECK
    if (typeof videoPopup === "function") {
      videoPopup();
    }

    // OWL CAROUSEL SAFE CHECK
    if ($('.owl-carousel').length && $.fn.owlCarousel) {

      $('.owl-carousel').owlCarousel({
        loop: true,
        margin: 30,
        nav: true,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,

        responsive: {
          0: {
            items: 1
          },
          550: {
            items: 2
          },
          750: {
            items: 3
          },
          1000: {
            items: 4
          },
          1200: {
            items: 5
          }
        }
      });

    }

    // SLICK SLIDER SAFE CHECK
    if ($('.Modern-Slider').length && $.fn.slick) {

      $(".Modern-Slider").slick({
        autoplay: true,
        autoplaySpeed: 10000,
        speed: 600,
        slidesToShow: 1,
        slidesToScroll: 1,
        pauseOnHover: false,
        dots: true,
        pauseOnDotsHover: true,
        cssEase: 'fade',
        draggable: false,
        prevArrow: '<button class="PrevArrow"></button>',
        nextArrow: '<button class="NextArrow"></button>',
      });

    }

    // FEATURES HOVER
    $("div.features-post").hover(
      function () {
        $(this).find("div.content-hide").stop(true, true).slideToggle("medium");
      },
      function () {
        $(this).find("div.content-hide").stop(true, true).slideToggle("medium");
      }
    );

    // JQUERY UI TABS SAFE CHECK
    if ($("#tabs").length && $.fn.tabs) {
      $("#tabs").tabs();
    }

    // COUNTDOWN TIMER
    (function init() {

      function getTimeRemaining(endtime) {

        var t = Date.parse(endtime) - Date.parse(new Date());

        var seconds = Math.floor((t / 1000) % 60);
        var minutes = Math.floor((t / 1000 / 60) % 60);
        var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
        var days = Math.floor(t / (1000 * 60 * 60 * 24));

        return {
          total: t,
          days: days,
          hours: hours,
          minutes: minutes,
          seconds: seconds
        };
      }

      function initializeClock(endtime) {

        var timeinterval = setInterval(function () {

          var t = getTimeRemaining(endtime);

          // SAFE ELEMENT CHECKS
          const daysEl = document.querySelector(".days > .value");
          const hoursEl = document.querySelector(".hours > .value");
          const minutesEl = document.querySelector(".minutes > .value");
          const secondsEl = document.querySelector(".seconds > .value");

          if (daysEl) daysEl.innerText = t.days;
          if (hoursEl) hoursEl.innerText = t.hours;
          if (minutesEl) minutesEl.innerText = t.minutes;
          if (secondsEl) secondsEl.innerText = t.seconds;

          if (t.total <= 0) {
            clearInterval(timeinterval);
          }

        }, 1000);

      }

      initializeClock(((new Date()).getFullYear() + 1) + "/1/1");

    })();

  });

})(jQuery);