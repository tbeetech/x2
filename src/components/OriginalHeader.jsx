import React, { useEffect } from 'react';
import $ from 'jquery';

export default function OriginalHeader() {
  useEffect(() => {
    let didScroll;
    let lastScrollTop = 0;
    const delta = 5;

    const handleScroll = () => {
      didScroll = true;
      const st = $(window).scrollTop();
      if (st > 40) {
        $("body").addClass('scrolled');
      } else {
        $("body").removeClass('scrolled');
      }
    };

    const hasScrolled = () => {
      const st = $(window).scrollTop();
      const navbarHeight = $('#header').outerHeight() || 114;
      if (Math.abs(lastScrollTop - st) <= delta) return;
      if (st > lastScrollTop && st > navbarHeight) {
        $('#header').removeClass('nav-down').addClass('nav-up');
      } else {
        if (st + $(window).height() < $(document).height()) {
          $('#header').removeClass('nav-up').addClass('nav-down');
        }
      }
      lastScrollTop = st;
    };

    $(window).on('scroll', handleScroll);
    const intervalId = setInterval(() => {
      if (didScroll) {
        hasScrolled();
        didScroll = false;
      }
    }, 250);

    handleScroll();

    return () => {
      $(window).off('scroll', handleScroll);
      clearInterval(intervalId);
      $("body").removeClass('scrolled');
      $('#header').removeClass('nav-down nav-up');
    };
  }, []);

  return (
    <div dangerouslySetInnerHTML={{__html: `
<img aria-hidden="true" id="background-image" src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/page-background.svg" alt="Marex Background Sketch">

<!-- Body Wrapper -->
<div id="body-wrapper">

    <!-- Page Wrapper -->
    <div id="page-wrapper">

        <!-- Header -->
        <header id="header" class="x-fade" role="banner">
            <div class="header-inner">

                <!-- Marex Logo -->
                <a href="https://www.marex.com" id="marex-logo" title="Marex" target="_blank">
                    <img class="logo-small" src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/marex-logo-icon.svg" alt="Marex Logo Icon">
                    <img class="logo-large" src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/marex-logo.svg" alt="Marex Logo">
                </a>

                <!-- Logo -->
                <a href="/" id="logo" title="XFA">
                    <img src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/logo.svg" alt="XFA Logo">
                    <img class="square" src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/logo-square.svg" alt="XFA Logo">
                </a>

                <!-- Nav Wrapper -->
                <div class="nav-wrapper">

                    <!-- Desktop Menu -->
                    <nav class="nav" role="navigation" aria-label="Main Navigation">
                        <ul class="menu">
                            <li id="menu-item-36" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-home current-menu-item page_item page-item-2 current_page_item columns-one-column alignment-left menu-item-36"><a href="/" aria-current="page">Home</a></li>
                            <li id="menu-item-37" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children columns-one-column alignment-left menu-item-37"><a href="/about">About Us</a>
                                <ul class="sub-menu">
                                    <li id="menu-item-603" class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-603"><a href="/about">About Us</a></li>
                                    <li id="menu-item-628" class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-628"><a href="/about#join-the-team">Join the team</a></li>
                                    <li id="menu-item-604" class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-604"><a href="/about#faqs">FAQs</a></li>
                                    <li id="menu-item-605" class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-605"><a href="/about#compliance">Compliance &amp; Disclosures</a></li>
                                </ul>
                            </li>
                            <li id="menu-item-641" class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-641"><a href="/contact">News &amp; Updates</a></li>
                            <li id="menu-item-38" class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-38"><a href="/contact">Contact Us</a></li>
                        </ul>
                    </nav>

                </div>

                <!-- Mobile Menu Button -->
                <button id="mobile-menu-button" title="Mobile Menu Button">
                    <span class="lines">
                        <span class="line"></span>
                        <span class="line"></span>
                        <span class="line"></span>
                        <span class="line"></span>
                    </span>
                    <span class="text">Menu</span>
                </button>

                <!-- Sidebar Mobile Wrap -->
                <div class="sidebar-mobile-wrap">

                    <!-- Mobile Menu -->
                    <div class="show-medium">
                        <nav class="nav" role="navigation" aria-label="Main Navigation">
                            <ul class="menu prevent-columns">
                                <li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-home current-menu-item page_item page-item-2 current_page_item columns-one-column alignment-left menu-item-36"><a href="/" aria-current="page">Home</a></li>
                                <li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children columns-one-column alignment-left menu-item-37"><a href="/about">About Us</a>
                                    <ul class="sub-menu">
                                        <li class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-603"><a href="/about">About Us</a></li>
                                        <li class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-628"><a href="/about#join-the-team">Join the team</a></li>
                                        <li class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-604"><a href="/about#faqs">FAQs</a></li>
                                        <li class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-605"><a href="/about#compliance">Compliance &amp; Disclosures</a></li>
                                    </ul>
                                </li>
                                <li class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-641"><a href="/contact">News &amp; Updates</a></li>
                                <li class="menu-item menu-item-type-post_type menu-item-object-page columns-one-column alignment-left menu-item-38"><a href="/contact">Contact Us</a></li>
                            </ul>
                        </nav>
                    </div>

                    <!-- Social Icons -->
                    <div class="social-icons"></div>

                    <!-- Mobile Marex Logo -->
                    <a href="/" id="mobile-marex-logo" title="Marex">
                        <img class="logo-large" src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/marex-logo.svg" alt="Marex Logo">
                    </a>

                </div>

            </div>
        </header>
    `}} />
  );
}
