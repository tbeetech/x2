import React, { useEffect } from 'react';

export default function OriginalMain() {
  useEffect(() => {
    // Re-trigger owl carousel after React mounts the DOM
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      if (typeof window.siteInit === 'function') window.siteInit();
    }, 500);
  }, []);

  return (
    <div dangerouslySetInnerHTML={{__html: `

        <!-- Modules Container -->
        <div id="modules-container" role="main">

            <!-- Intro Module -->
            <section class="intro-module-container">
                <article class="intro-module x-fade">
                    <h1>Industry-leading trade execution services for exchange-traded derivatives across the globe.</h1>
                    <p>XFA provides superior trade execution, price discovery, confirmation and market intelligence services.</p>
                </article>
            </section>

            <!-- Banner Slider Module -->
            <section class="banner-slider-module-container has-caption">
                <article class="banner-slider-module x-fade">
                    <div class="owl-carousel">

                        <div>
                            <div class="image">
                                <img width="1920" height="600" loading="lazy" src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4219-1920x600.jpg" alt="Largest Floor Broker on the Cboe in 2022*">
                            </div>
                            <div class="caption">
                                <h3>Largest Floor Broker on the Cboe in 2022*</h3>
                            </div>
                        </div>

                        <div>
                            <div class="image">
                                <img width="1920" height="600" loading="lazy" src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4331-1920x600.jpg" alt="#1 ranked on the Cboe with most volume*">
                            </div>
                            <div class="caption">
                                <h3>#1 ranked on the Cboe with most volume*</h3>
                            </div>
                        </div>

                        <div>
                            <div class="image">
                                <img width="1920" height="600" loading="lazy" src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4206-sm-1920x600.jpg" alt="#1 ranked on S&P 500® Index (SPX)*">
                            </div>
                            <div class="caption">
                                <h3>#1 ranked on S&amp;P 500® Index (SPX)*</h3>
                            </div>
                        </div>

                        <div>
                            <div class="image">
                                <img width="1920" height="600" loading="lazy" src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4275-1920x600.jpg" alt="#2 ranked on the Cboe Volatility Index® (VIX)*">
                            </div>
                            <div class="caption">
                                <h3>#2 ranked on the Cboe Volatility Index® (VIX)*</h3>
                            </div>
                        </div>

                    </div>
                </article>
            </section>

            <!-- Page Content -->
            <section class="page-content-container">
                <article class="page-content x-fade">
                    <div class="text-block">
                        <p><small>Photography provided as a courtesy by Cboe Exchange, Inc.</small><br>
                        <small>* &#8211; per Cboe Global Markets statistical data 2021-2022</small></p>
                        <p>XFA serves as our customer&#8217;s agent throughout the institutional trade execution process. Led by a team of respected experts, the 130 strong team is the largest floor broker on the Chicago Board Options Exchange (Cboe).</p>
                        <p>With XFA, you benefit from access to deep liquidity pools from market maker groups, proprietary trading units and investment banks. Operating across three continents our clients include global financial services firms, hedge funds, and institutional investors as well as commodity trading advisors (CTAs) and market makers. XFA provides anonymity through our vast channels of liquidity both electronically and open outcry.</p>
                        <p>XFA is a division of Marex.</p>
                    </div>
                </article>
            </section>

            <!-- Interest Box Module -->
            <section class="interest-box-module-container">
                <article class="interest-box-module">
                    <div class="image">
                        <img width="672" height="414" loading="lazy"
                            srcset="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4493-1-1344x828.jpg 2x, https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4493-1-672x414.jpg 1x"
                            src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4493-1-672x414.jpg"
                            alt="Contact the team">
                    </div>
                    <div class="text">
                        <div class="inner-text x-fade">
                            <h2>Contact the team</h2>
                            <a href="mailto:info@x-fa.com" target="_blank" class="button border">info@x-fa.com <img src="https://xfa.marex.com/wp-content/themes/marex-xfa/assets/img/icons/buttons/icon-email-link.svg" alt="Email Link Icon"></a>
                        </div>
                    </div>
                </article>
            </section>

        </div>

    </div><!-- /page-wrapper -->

    `}} />
  );
}
