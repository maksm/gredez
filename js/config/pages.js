export const pages = {
  'index': {
    title: 'Trenutno stanje',
    sourceUrl: 'https://meteo.arso.gov.si/pda/',
    images: [
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/surface/graphic/weatherSat_si_pda.png',
        alt: 'Trenutno stanje'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/radar/si0_zm_pda_latest.gif',
        alt: 'Padavine zadnje'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/satellite/nwcsaf_ct_pda_latest.gif',
        alt: 'Oblacnost zadnje'
      }
    ],
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
    ]
  },
  'radar': {
    title: 'Zadnjih 30 min',
    sourceUrl: 'https://meteo.arso.gov.si/pda/',
    images: [
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/radar/si0_zm_pda_anim.gif',
        alt: 'Padavine zadnje'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/observ/satellite/nwcsaf_ct_pda_anim.gif',
        alt: 'Oblacnost zadnje'
      }
    ]
  },
  'aladin': {
    title: 'Aladin napoved',
    sourceUrl: 'https://meteo.arso.gov.si/met/sl/forecast/graphics/',
    images: [
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_006.png',
        alt: '+6 ur'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_009.png',
        alt: '+9 ur'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_012.png',
        alt: '+12 ur'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_015.png',
        alt: '+15 ur'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/aladin/field/as_tcc-rr_si-pda_pda_018.png',
        alt: '+18 ur'
      }
    ]
  },
  'epsgram': {
    title: 'EPSgram napoved',
    sourceUrl: 'https://meteo.arso.gov.si/met/sl/forecast/epsogram/',
    images: [
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_tccd_SLOVENIA_MIDDLE_pda_latest.png',
        alt: 'EPSgram napoved oblačnosti'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_tpd_SLOVENIA_MIDDLE_pda_latest.png',
        alt: 'EPSgram napoved padavin'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_ff10d_SLOVENIA_MIDDLE_pda_latest.png',
        alt: 'EPSgram napoved vetra'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_dd10d_SLOVENIA_MIDDLE_pda_latest.png',
        alt: 'EPSgram napoved smeri vetra'
      },
      {
        src: 'https://meteo.arso.gov.si/uploads/probase/www/model/ecmwf/ef_tmnx2md_SLOVENIA_MIDDLE_pda_latest.png',
        alt: 'EPSgram napoved temperature'
      }
    ]
  },
  'blitz': {
    title: 'Strele',
    sourceUrl: 'https://blitz.greco.eu/index.php?page=1&lang=en',
    images: [
      {
        src: 'https://images.lightningmaps.org/blitzortung/europe/index.php?map=6',
        alt: 'Strele zadnjih 6 ur'
      }
    ]
  },
  'gefs': {
    title: 'GEFS napoved',
    sourceUrl: 'https://www.wetterzentrale.de/en/weather_maps.php',
    images: [
      {
        id: 'gefs-img',
        alt: 'GEFS napoved'
      }
    ]
  }
};
