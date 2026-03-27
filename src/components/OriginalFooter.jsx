import React from 'react';

export default function OriginalFooter() {
  return (
    <div dangerouslySetInnerHTML={{__html: `

    <!-- Footer -->
    <footer id="footer">
        <div class="footer-inner">

            <!-- Footer Logo -->
            <a href="https://www.marex.com" id="footer-logo" title="Marex" target="_blank">
                <img src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/footer-logo.svg" alt="Marex Logo">
                <small>XFA is a division of Marex</small>
            </a>

            <div class="division-footer">

                <p class="copyright copyright-division">&copy; Marex 2026. All rights reserved.</p>

                <!-- Footer Nav -->
                <nav class="footer-nav" role="navigation" aria-label="Footer Main Navigation">
                    <ul class="footer-menu">
                        <li id="menu-item-274" class="menu-item menu-item-type-post_type menu-item-object-page columns- alignment- menu-item-274"><a href="/about#faqs">FAQs</a></li>
                        <li id="menu-item-273" class="menu-item menu-item-type-post_type menu-item-object-page columns- alignment- menu-item-273"><a href="/about#compliance">Compliance &amp; Disclosures</a></li>
                        <li id="menu-item-276" class="menu-item menu-item-type-custom menu-item-object-custom columns- alignment- menu-item-276"><a href="https://www.marex.com/modern-slavery-statement/" target="_blank" rel="noopener">Modern Slavery Statement</a></li>
                        <li id="menu-item-277" class="menu-item menu-item-type-custom menu-item-object-custom columns- alignment- menu-item-277"><a href="https://www.marex.com/privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a></li>
                        <li id="menu-item-278" class="menu-item menu-item-type-custom menu-item-object-custom columns- alignment- menu-item-278"><a href="https://www.marex.com/terms-of-use/" target="_blank" rel="noopener">Terms of Use</a></li>
                        <li id="menu-item-279" class="menu-item menu-item-type-custom menu-item-object-custom columns- alignment- menu-item-279"><a href="https://www.marex.com/services-terms-and-conditions/" target="_blank" rel="noopener">Services T&amp;C</a></li>
                        <li id="menu-item-284" class="menu-item menu-item-type-custom menu-item-object-custom columns- alignment- menu-item-284"><a href="https://www.marex.com/cookie-policy/" target="_blank" rel="noopener">Cookie Policy</a></li>
                    </ul>
                </nav>

                <!-- Social Icons -->
                <div class="social-icons"></div>

            </div>

        </div>
    </footer>

</div><!-- /body-wrapper -->

    `}} />
  );
}
