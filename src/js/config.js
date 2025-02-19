export default {
  pages: {
    home: {
      route: '/',
      title: 'Trenutno',
      links: [
        {
          text: 'Napoved tekst',
          url: 'https://meteo.arso.gov.si/pda/fproduct/'
        },
        {
          text: 'Podatki Ljubljana',
          url: 'https://meteo.arso.gov.si/uploads/probase/www/observ/surface/text/sl/observationAms_LJUBL-ANA_BEZIGRAD_history.html'
        },
        {
          text: 'Podatki vsi',
          url: 'https://meteo.arso.gov.si/met/sl/service/'
        },
        {
          text: 'Stanje vode',
          url: 'https://www.arso.gov.si/vode/podatki/stanje_voda_samodejne.html'
        }
      ],
      images: [
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/surface/graphic/weatherSat_si_pda.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/radar/si0_zm_pda_anim.gif',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/satellite/nwcsaf_ct_pda_anim.gif',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://images.lightningmaps.org/blitzortung/europe/index.php?map=6',
          clickUrl: 'https://blitz.greco.eu/index.php?page=1&lang=en'
        }
      ]
    },
    forecast: {
      route: '/napoved',
      title: 'Napoved',
      images: [
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_tccd_SLOVENIA_MIDDLE_pda_latest.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_tpd_SLOVENIA_MIDDLE_pda_latest.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_ff10d_SLOVENIA_MIDDLE_pda_latest.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_dd10d_SLOVENIA_MIDDLE_pda_latest.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_tmnx2md_SLOVENIA_MIDDLE_pda_latest.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_006.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_009.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_012.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_015.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_018.png',
          clickUrl: 'https://meteo.arso.gov.si/pda/'
        },
        {
          src: `https://modeles16.meteociel.fr/modeles/gensp/runs/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}00/graphe3_10000___14.2452830189_45.7894736842_.gif`,
          clickUrl: 'https://www.wetterzentrale.de/en/weather_maps.php'
        }
      ]
    }
  }
};
