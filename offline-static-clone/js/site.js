// Load service worker.
window.onload = function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js');
    }
}

$ = jQuery.noConflict();

setTimeout(function () {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}, 10)


var $logoOffset = 0;
var $marexLogoWidth = 285;
var $logoOffsetExtra = 50;

// Resize Items Function
resizeItems = function () {

    // Sidebar Menu
    setTimeout(function () {
        $(".menu>li>ul").each(function () {
            $submenu = $(this);
            $offset = $submenu.parent().offset().top - $(window).scrollTop();
            $height = $submenu.outerHeight(true);
            if ($offset + $height > $(window).height()) {
                $difference = ($offset + $height) - $(window).height();
                $submenu.css('margin-top', $difference * -1);
            } else {
                $submenu.css('margin-top', 0);
            };
        });
    }, 200);


    // Careers Masonry
    if ($('.cards.grid').length) {
        $(".cards.grid .card a>.text").adjustOuterHeight();
        setTimeout(function () {
            $(".cards.grid").isotope('layout');
        }, 1000);
    };


    // Marex Logo
    if ($("#marex-logo").length) {
        $logoOffset = $(".header-inner").offset().left;
    };
};


$(window).on('load', function () {


    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        $('#safari-favicon').attr('color', '#ffffff');
    } else {
        $('#safari-favicon').attr('color', '#7F3E98');
    }

    // Resize Items
    resizeItems();


    // Trigger Animations
    animations();


    // Transitional Effects
    setTimeout(function () {
        $("body a, body input[type='submit'], button").addClass("loaded");
    }, 1000);


    // Careers Masonry
    if ($('.cards.grid').length) {
        var $grid = $('.cards.grid');
        $grid.isotope({
            itemSelector: '.card',
            percentPosition: true,
            resizable: false,
            layoutMode: 'fitRows',
            masonry: {
                columnWidth: '.grid-sizer'
            }
        });

        $(".cards.grid").isotope('layout');

        // Filters
        $filters = $('.filters').on('click', 'a', function (e) {
            e.preventDefault();
            $grid.find('.x-fade').removeClass('x-fade');
            var $this = $(this);
            var filterValue;
            if ($this.is('.is-checked')) {
                filterValue = '*';
            } else {
                filterValue = $this.attr('data-filter');
                $filters.find('.is-checked').removeClass('is-checked');
            }
            $this.toggleClass('is-checked');
            $grid.isotope({ filter: filterValue });
            if ($(window).width() < 768) {
                $('html,body').animate({ scrollTop: $(".cards.grid").offset().top }, 600, 'easeOutQuart');
            }
        });

    };

    $('.map-filters-nav').on('click', 'a', function (e) {
        e.preventDefault();
        $a = $(this);
        $('.map-filters-nav a').removeClass('active')
        $a.addClass('active')
        $(".location-cards").hide();
        $(".location-cards.location-" + $a.data('location')).show();
    });
    $('.map-filters-nav a').first().click();


    // Members Hash
    $hash = window.location.hash;
    $offset = 160;
    if ($("body").hasClass('term-senior-management') && $hash.indexOf("member") != -1) {
        if ($(window).width() < 991) {
            $offset = 70;
        };
        $newHash = $hash.replace('member-', '');
        if ($($newHash).length) {
            $('html, body').animate({
                scrollTop: $($newHash).offset().top - $offset
            }, 500, 'easeOutQuart');
        };
    };
});

document.addEventListener("DOMContentLoaded", function () {
    var otfField = document.getElementById("otf-password-id");

    if (otfField) {
        otfField.oninvalid = function (e) {
            e.target.setCustomValidity("");
            if (!e.target.validity.valid) {
                e.target.setCustomValidity("Password should have at least 8 characters, at least 1 uppercase character, at least 1 lowercase character, at least 1 number and at least 1 special character");
            }
        };
        otfField.oninput = function (e) {
            e.target.setCustomValidity("");
        };
    }
});

$(document).ready(function () {
    // Resize Items
    resizeItems();

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        $('#safari-favicon').attr('color', '#ffffff');
    } else {
        $('#safari-favicon').attr('color', '#7F3E98');
    }



    // Sidebar Menu
    $(".menu li").each(function () {
        $li = $(this);
        if ($li.find('ul').length) {
            $li.addClass('has-submenu');
        };
    });


    // Custom Menu Layout
    $(".menu:not(.prevent-columns) li.columns-two-columns").each(function () {
        $li = $(this);
        $ul = $li.find('> ul');
        $links = $ul.find('> li:not(:first)');
        $overview_link = $ul.find('> li:first');
        $ul.html('');
        $ul.append($overview_link);
        $ul.append('<div class="col col-left"></div><div class="col col-right"></div>');

        $.each($links, function (i, $link) {
            if ($($link).hasClass('alignment-left')) {
                $($link).appendTo($ul.find('.col-left'));
            }
            if ($($link).hasClass('alignment-right')) {
                $($link).appendTo($ul.find('.col-right'));
            }
        });
    });

    $('body').on('click', 'a.no-click', function (e) {
        e.preventDefault();
    });

    $('body').on('click', '.posts-container .load-more a', function (e) {
        e.preventDefault();

        var $button = $(this);
        $button.find('span').text('Please wait...');

        $div = $('<div />');

        $div.load($(this).attr('href') + ' .posts-container', function () {

            $(".posts-container .posts").append($div.find('.posts-container .posts > *'));
            animations();
            // window.history.pushState(null, document.title, $button.attr('href'));
            if ($div.find('.load-more a').length) {
                $button.find('span').text('Load more');
                $button.attr('href', $div.find('.load-more a').attr('href'));
            } else {
                $button.parent().remove();
            }
        });

    });

    // Search Form
    var $searchValue = '';
    $(".search-form input[type='text']").on('blur', function () {
        $searchValue = $(this).val();
        $(this).val('');
        $("body").removeClass('search-focused');
    });

    if ($(window).width() > 1200) {
        $('.sidebar-mobile-wrap > nav > ul > li.has-submenu > a').on('mouseenter', function () {
            $('.sidebar-mobile-wrap > nav > ul > li.is-hover').removeClass('is-hover');
        });
        $('.sidebar-mobile-wrap > nav > ul > li.has-submenu > a').on('mouseenter', function () {
            $(this).parent().addClass('is-hover');
        });
        $('.sidebar-mobile-wrap > nav > ul > li.has-submenu > ul').on('mouseleave', function () {
            var self = $(this).parent();
            self.addClass('is-hover');
            setTimeout(function () {
                self.removeClass('is-hover');
            }, 1000);
        });
        $('.sidebar-mobile-wrap > nav > ul > li.has-submenu > a').on('mouseleave', function () {
            var self = $(this).parent();
            self.addClass('is-hover');
            setTimeout(function () {
                self.removeClass('is-hover');
            }, 1000);
        });
    }

    $(".search-form input[type='text']").on('focus', function () {
        $(this).val($searchValue);
        $("body").addClass('search-focused');

        if ($(window).width() < 767) {
            setTimeout(function () {
                $(".sidebar-mobile-wrap").scrollTop(150);
            }, 100)
        };
    });

    $('#gform_1').each(function () {
        var $this = $(this);
        $this.find('.gform_footer').appendTo($this.find('.gfmc-row-1-col-2-of-2 > ul'));
    });
    jQuery(document).on('gform_page_loaded', function (event, form_id, current_page) {
        $('#gform_1').each(function () {
            var $this = $(this);
            $this.find('.gform_footer').appendTo($this.find('.gfmc-row-1-col-2-of-2 > ul'));
        });
    });

    // Empty Links
    $('body').on('click', 'a.no-link', function (e) {
        e.preventDefault();
    });

    // Document Scroll
    $(document).scroll(function () {

        // Scrolled
        if ($(window).scrollTop() > 40) {
            $("body").addClass('scrolled');
        } else {
            $("body").removeClass('scrolled');
        };

        // Trigger Animations
        animations();

        // BG Image
        $("#background-image").css('margin-top', $(window).scrollTop() * -0.15);

    });

    $(document).trigger('scroll');


    // Mobile Menu
    $("body").on('click', '.menu>li.has-submenu>a', function (e) {
        e.stopPropagation();
        if ($(window).width() > 991 && $(window).width() < 1200) {
            e.preventDefault();
            $this = $(this);
            if ($this.parent().hasClass('open')) {
                $this.parent().removeClass('open');
            } else {
                $(".menu li.open").removeClass('open');
                $this.parent().addClass('open');
            };
        } else if ($(window).width() < 991) {
            e.preventDefault();
            $this = $(this);
            if ($this.parent().hasClass('open')) {
                $this.parent().removeClass('open');
                $this.parent().find('>ul').slideUp(300, 'easeOutQuart');
            } else {
                $(".menu li.open").find('ul').slideUp(300, 'easeOutQuart');
                $(".menu li.open").removeClass('open');
                $this.parent().addClass('open');
                $this.parent().find('>ul').slideDown(300, 'easeOutQuart');
            };
        };
    });

    $("body").on('click', '.menu>li>ul li.has-submenu>a', function (e) {
        e.stopPropagation();
        if ($(window).width() < 991) {
            e.preventDefault();
            $this = $(this);
            if ($this.parent().hasClass('open')) {
                // $this.parent().removeClass('open');
                // $this.parent().find('>ul').slideUp(300, 'easeOutQuart');
                window.location.href = $this.attr('href');
            } else {
                $this.parent().addClass('open');
                $this.parent().find('>ul').slideDown(300, 'easeOutQuart');
            };
        };
    });

    if ($(window).width() < 991) {
        $(".menu li.current-menu-ancestor").addClass('open');
        $(".menu li.current-menu-parent").addClass('open');
        // $(".menu li.current-menu-item").addClass('open');
        $(".menu li.current-menu-ancestor>ul").slideDown();
        $(".menu li.current-menu-parent>ul").slideDown();
        // $(".menu li.current-menu-item>ul").slideDown();
    };

    // $("body").on('click', function () {
    //     $(".menu li.open").removeClass('open');
    // });

    $("body").on('click', '.menu', function (e) {
        e.stopPropagation();
    });


    $("body").on('click', '#mobile-menu-button', function () {
        $this = $(this);
        if ($this.hasClass('active')) {
            $this.removeClass('active');
            $this.find('.text').text('Menu');
            $("body").removeClass('menu-open');
        } else {
            $this.addClass('active');
            $this.find('.text').text('Close');
            $("body").addClass('menu-open');
        }
    });


    // Alert
    $('body').on('click', '.c-alert', function (e) {
        e.preventDefault();
        $this = $(this);
        $this.animate({ opacity: 0 }, 300, 'easeOutQuart', function () {
            $this.remove();
        });
    });


    // Sidebar Mobile
    $(".sidebar-mobile-wrap").scroll(function () {
        if ($(".sidebar-mobile-wrap").scrollTop() > 50) {
            $("body").addClass('hide-logo');
        } else {
            $("body").removeClass('hide-logo');
        };
    });


    // Hide Header on Scroll Down
    var didScroll;
    var lastScrollTop = 0;
    var delta = 5;
    var navbarHeight = 0;
    if ($("#sidebar").length) {
        navbarHeight = $('#sidebar').outerHeight();
    } else {
        navbarHeight = $('#header').outerHeight();
    }

    $(window).scroll(function (event) {
        didScroll = true;
    });

    setInterval(function () {
        if (didScroll) {
            hasScrolled();
            didScroll = false;
        }
    }, 250);

    function hasScrolled() {
        var st = $(this).scrollTop();

        // Make sure they scroll more than delta
        if (Math.abs(lastScrollTop - st) <= delta)
            return;

        // If they scrolled down and are past the navbar, add class .nav-up.
        // This is necessary so you never see what is "behind" the navbar.
        if (st > lastScrollTop && st > navbarHeight) {
            // Scroll Down
            if ($("#sidebar").length) {
                $('#sidebar').removeClass('nav-down').addClass('nav-up');
            } else {
                $('#header').removeClass('nav-down').addClass('nav-up');
            }
        } else {
            // Scroll Up
            if (st + $(window).height() < $(document).height()) {
                if ($("#sidebar").length) {
                    $('#sidebar').removeClass('nav-up').addClass('nav-down');
                } else {
                    $('#header').removeClass('nav-up').addClass('nav-down');
                }
            }
        }

        lastScrollTop = st;
    }


    // Contacts Module Carousel
    if ($(".contacts-module .owl-carousel").length) {
        var $contactsCarousel = $(".contacts-module .owl-carousel").owlCarousel({
            items: 1,
            margin: 0,
            nav: false,
            dots: true,
            dotsEach: true,
            onInitialized: callback,
            responsive: {
                0: {
                    items: 1,
                },
                1200: {
                    items: 2,
                }
            }
        });

        function callback(event) {
            $(".contacts-module .owl-carousel .owl-dots button").each(function () {
                $this = $(this);
                $this.attr('aria-label', 'Go to slide ' + $this.index());
            });

            $(".contacts-module .owl-carousel .owl-nav .owl-prev").removeAttr('role');
            $(".contacts-module .owl-carousel .owl-nav .owl-next").removeAttr('role');
            $(".contacts-module .owl-carousel .owl-nav .owl-prev span").attr('aria-label', 'Previous Slide');
            $(".contacts-module .owl-carousel .owl-nav .owl-next span").attr('aria-label', 'Next Slide');
        };


        $("body").on('click', '.contacts-module .owl-item .thumb', function (e) {
            e.stopPropagation();
            n = $(this).parents('.owl-item').index();
            if (n + 1 != $(".contacts-module .owl-carousel .owl-item").length && $(window).width() > 1200) {
                $contactsCarousel.trigger('to.owl.carousel', n);
            } else if ($(window).width() < 1200) {
                $contactsCarousel.trigger('to.owl.carousel', n);
            };
        });
    };


    // Technology Module
    if ($(".technology-module .text-image").length) {
        $(".technology-module .text-image .text .item").mouseenter(function () {
            $this = $(this);
            $index = $this.index();
            if (!$(".technology-module .text-image .images .item").eq($index).hasClass('active')) {
                $(".technology-module .text-image .images .item").removeClass('active');
                $(".technology-module .text-image .images .item").eq($index).addClass('active');
            };
        });

        $(".technology-module").each(function () {
            $module = $(this);
            if ($module.find('.text .item').length < 2) {
                $module.addClass('less-items');
            };
        });
    };


    // Cards Carousel Module
    if ($(".cards.carousel .owl-carousel").length) {
        $(".cards.carousel .owl-carousel").owlCarousel({
            items: 1,
            margin: 0,
            nav: false,
            dots: true,
            dotsEach: true,
            onInitialized: cardsCallback,
            responsive: {
                0: {
                    items: 1,
                },
                1200: {
                    items: 2,
                }
            }
        });


        function cardsCallback(event) {
            $(".cards .owl-carousel .owl-dots button").each(function () {
                $this = $(this);
                $this.attr('aria-label', 'Go to slide ' + $this.index());
            });

            $(".cards .owl-carousel .owl-nav .owl-prev").removeAttr('role');
            $(".cards .owl-carousel .owl-nav .owl-next").removeAttr('role');
            $(".cards .owl-carousel .owl-nav .owl-prev span").attr('aria-label', 'Previous Slide');
            $(".cards .owl-carousel .owl-nav .owl-next span").attr('aria-label', 'Next Slide');
        };
    };



    // FAQs Module
    if ($(".faqs").length) {
        $("body").on('click', '.faqs .faq .faq-question', function (e) {
            e.preventDefault();
            $this = $(this);
            if ($this.hasClass('active')) {
                $this.removeClass('active');
                $this.parent().find('.faq-answer').slideUp(300, 'easeOutQuart')
            } else {
                $this.addClass('active');
                $this.parent().find('.faq-answer').slideDown(300, 'easeOutQuart')
            };
        });
    };


    // Tables
    if ($("#modules-container table:not(.no-scroller)").length) {
        $("#modules-container table:not(.no-scroller)").each(function () {
            $table = $(this);
            $table.wrap('<div class="table-scroller" />');
        });
    };


    // Tabs
    if ($(".tabs").length) {
        $("body").on('click', '.tabs .tab .buttons a', function (e) {
            e.preventDefault();
            $this = $(this);
            $tab = $this.attr('href');
            if (!$($tab).hasClass('active')) {
                $(".tabs .tab").removeClass('active');
                $($tab).addClass('active');
            };
        });
    };


    // Blocker
    if ($('#blocker form').length) {
        $("#blocker form select").change(function () {
            $("#blocker form").submit();
        });
    };


    // Intro Module Padding Fix
    if ($(".intro-module-container").length) {
        $(".intro-module-container").each(function () {
            $this = $(this);
            if ($this.next().hasClass('hero-image-module-container')) {
                $this.addClass('padding');
            };
        });
    };


    // Marex Logo
    if ($("#marex-logo").length) {
        $("#marex-logo").mouseenter(function () {
            if ($marexLogoWidth > $logoOffset - $logoOffsetExtra) {
                $("#logo").css('left', $marexLogoWidth - $logoOffset + $logoOffsetExtra);
            };
        });

        $("#marex-logo").mouseleave(function () {
            $("#logo").css('left', 0);
        });
    };


    // Cards Carousel Module
    if ($(".banner-slider-module .owl-carousel").length) {
        $(".banner-slider-module .owl-carousel").owlCarousel({
            items: 1,
            margin: 0,
            nav: false,
            dots: false,
            autoplay: true,
            autoplayTimeout: 5000,
            loop: true,
            mouseDrag: false,
            touchDrag: false,
            pullDrag: false,
            freeDrag: false,
            autoplaySpeed: 1000,
            // onTranslate: bannerslidercallback
            onChange: function () {
                setTimeout(function () {
                    $(".banner-slider-module .owl-item.active").find(".caption").addClass('hide');
                    $(".banner-slider-module .owl-item:not(.active) .caption").removeClass('hide');
                }, 3500);
            }
        });
    };

    function bannerslidercallback(event) {
        setTimeout(function () {

        })
    }
});


var w = $(window).width();
$(window).resize(function () {
    // Resize Items
    if ($(window).width() == w) return;
    w = $(window).width();
    resizeItems();
});


// Adjust Height Function
$.fn.adjustHeight = function () {
    var maxHeightFound = 0;
    this.css('min-height', '1px');
    if (this.is('a')) {
        this.removeClass('loaded');
    };
    this.each(function () {
        if ($(this).height() > maxHeightFound) {
            maxHeightFound = $(this).height();
        }
    });
    this.css('min-height', maxHeightFound);
    if (this.is('a')) {
        this.addClass('loaded');
    };
};


// Adjust OuterHeight Function
$.fn.adjustOuterHeight = function () {
    var maxHeightFound = 0;
    if (this.is('a')) {
        this.removeClass('loaded');
    };
    this.css('min-height', '1px');
    this.each(function () {
        if ($(this).outerHeight(true) > maxHeightFound) {
            maxHeightFound = $(this).outerHeight(true);
        }
    });
    this.css('min-height', maxHeightFound);
    if (this.is('a')) {
        this.addClass('loaded');
    };
};


// Adjust Height For N Items Function
$.fn.setMinHeight = function (setCount) {
    $this = this;
    this.css('min-height', '1px');
    this.find('a').removeClass('loaded');
    for (var i = 0; i < this.length; i += setCount) {
        var curSet = this.slice(i, i + setCount),
            height = 0;
        curSet.each(function () { height = Math.max(height, $(this).height()); })
            .css('min-height', height);
    }
    setTimeout(function () {
        $this.find('a').addClass('loaded');
    }, 200);
    return this;
};


// Adjust OuterHeight For N Items Function
$.fn.setMinOuterHeight = function (setCount, $boolean) {
    if (typeof $boolean === 'undefined') {
        $boolean = false;
    }
    $this = this;
    this.css('min-height', '1px');
    this.find('a').removeClass('loaded');
    for (var i = 0; i < this.length; i += setCount) {
        var curSet = this.slice(i, i + setCount),
            height = 0;
        curSet.each(function () { height = Math.max(height, $(this).outerHeight($boolean)); })
            .css('min-height', height);
    }
    setTimeout(function () {
        $this.find('a').addClass('loaded');
    }, 200);
    return this;
};


// Is In Viewport Function
$.fn.isInViewport = function () {
    var elementTop = $(this).offset().top - 70;
    var elementBottom = elementTop + $(this).outerHeight();
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
};


// Animations
function animations() {
    var animationDelay = 0;

    if ($(window).width() < 991) {
        $(".x-fade").removeClass('x-fade');
        $(".x-fade-left").removeClass('x-fade-left');
        $(".x-fade-right").removeClass('x-fade-right');
    };

    $('.x-fade').each(function () {
        var $fade = $(this);
        if ($fade.isInViewport() && !$fade.hasClass('x-fade-active')) {
            $fade.css('transition-delay', animationDelay + 's');
            $fade.addClass('x-fade-active');
            animationDelay += .2;

            setTimeout(function () {
                $fade.removeClass('x-fade x-fade-right x-fade-left x-fade-active');
            }, 6000);
        }
    });
};