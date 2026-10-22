/* NEO-LUBLIN 2049: tryb offline (service worker). Plik generuje tools/build.py z szablonu tools/szablony/sw.js.
   Zasada: przy połączeniu strona zawsze idzie z sieci (świeże terminy i materiały), pamięć urządzenia
   służy tylko wtedy, gdy sieci nie ma albo odpowiada dłużej niż kilka sekund.
   - powłoka (HTML, CSS, JS, SVG, ikony, aplikacje, pliki): zapisywana przy pierwszej wizycie; niezmienione pliki
     przechodzą do nowej wersji bez ponownego pobierania (porównanie skrótów z REV);
   - ilustracje z media/: zapisywane po obejrzeniu albo na żądanie („zapisz cały kurs”), usuwane, gdy znikną z kursu;
   - reveal.js i fonty z CDN: zapisywane przy pierwszym użyciu (adresy z wersją, więc się nie starzeją). */
"use strict";
var WERSJA = "6405cf166de9";
var STAN = "22.10.2026";
var POWLOKA = [["assets/eksploracja.css","a5176f5cbe7f11b3"],["assets/eksploracja.js","34a964538f1c5772"],["assets/fiszki.js","00b5cf3b254fb46b"],["assets/gra.js","6d1f8b6b9a4d64fe"],["assets/ikona-180.png","8c51eab6890d5e3e"],["assets/ikona-192.png","728dcfe46221253b"],["assets/ikona-512.png","818680314987329d"],["assets/jajka.js","6cf42f9e3491c640"],["assets/manifest.webmanifest","e5d0308792c673b9"],["assets/miasto.js","12619db404fb7604"],["assets/podziemia.js","50d201da4332d4fd"],["assets/quiz.js","768d8f3da5d89aef"],["assets/site.js","e069730764068757"],["assets/slajdy.css","fd3d234aca3bc4ea"],["assets/slajdy_neon.css","fd4ee5e6c6fd041d"],["assets/stare_miasto.js","94910beaf0f245ae"],["assets/style.css","29f7021f06bb123f"],["assets/ui.js","6f2bd7d551428743"],["assets/wnetrze.js","4544b1e50b4658c1"],["biblioteka.html","65af8b4ed49cfe10"],["fiszki.html","d5eb981d33878a47"],["index.html","fdbf8624ac76dba2"],["interaktywne/algorytm_w_lawce_szkolnej.html","b23c4c6ed1b12b7f"],["interaktywne/algorytm_w_todze.html","3dac7a70b8487ffb"],["interaktywne/algorytm_w_todze_prezentacja.html","ea04a5541dc5bd46"],["interaktywne/demo_tokeny.html","6b33aadf6abbff11"],["interaktywne/kalkulator_sladu.html","be9b45a47d61c0df"],["interaktywne/klasyfikator_ryzyka_ai_act.html","8c3747746cf6b19a"],["interaktywne/macierz_wyplat.html","bab5eff1d97ef5ff"],["interaktywne/os_czasu_ai.html","ab1327ad08f1d2e7"],["interaktywne/sonda_prognozy.html","0885de41ffabafa0"],["interaktywne/symulator_stronniczosci.html","771cb04f372acbd8"],["interaktywne.html","98b9c890405c8213"],["moduly/01_czym_jest_ai/index.html","3608770b3dd46fe0"],["moduly/01_czym_jest_ai/slajdy-tekst.html","9fcf713bc20187b9"],["moduly/01_czym_jest_ai/slajdy.html","a3fd7360c6838751"],["moduly/01_czym_jest_ai/wiedza.html","306dbe62c6b75cc8"],["moduly/02_historia_ai/index.html","4f6f01969d45a6d2"],["moduly/02_historia_ai/slajdy-tekst.html","2a95d4cd44de690f"],["moduly/02_historia_ai/slajdy.html","0010274a23934c37"],["moduly/02_historia_ai/wiedza.html","c3da9ec65cad2be2"],["moduly/03_podstawy_technologiczne/index.html","a255cc7c452e21d4"],["moduly/03_podstawy_technologiczne/slajdy-tekst.html","efb35dc83abab9f9"],["moduly/03_podstawy_technologiczne/slajdy.html","de90c2538cbde6cd"],["moduly/03_podstawy_technologiczne/slajdy_proba.html","b28215334f92d4ba"],["moduly/03_podstawy_technologiczne/wiedza.html","d2075ae09207aa9a"],["moduly/04_praca_i_edukacja/index.html","374f9dd46aa0bbe8"],["moduly/04_praca_i_edukacja/slajdy-tekst.html","7b9a6f376bca1b68"],["moduly/04_praca_i_edukacja/slajdy.html","a722db559c175c44"],["moduly/04_praca_i_edukacja/wiedza.html","31c2342446de4ad7"],["moduly/05_etyka_uprzedzenia_moderacja/index.html","2ed3303305216be3"],["moduly/05_etyka_uprzedzenia_moderacja/slajdy-tekst.html","f082245ccd464ed4"],["moduly/05_etyka_uprzedzenia_moderacja/slajdy.html","a7a3b639cc563d02"],["moduly/05_etyka_uprzedzenia_moderacja/wiedza.html","e93dc5d90a7d339b"],["moduly/06_kultura_regulacja_jezyk_sztuka/index.html","01f7d41ebc12d9f1"],["moduly/06_kultura_regulacja_jezyk_sztuka/slajdy-tekst.html","24b4c5023cd9a236"],["moduly/06_kultura_regulacja_jezyk_sztuka/slajdy.html","5ff69443d95e7f17"],["moduly/06_kultura_regulacja_jezyk_sztuka/wiedza.html","011be2cc05c6b184"],["moduly/07_prawo_I_regulacje_prawo_autorskie/index.html","5e35191b4c1a8435"],["moduly/07_prawo_I_regulacje_prawo_autorskie/slajdy-tekst.html","3689607d0cf11185"],["moduly/07_prawo_I_regulacje_prawo_autorskie/slajdy.html","df96560ad9fbcef0"],["moduly/07_prawo_I_regulacje_prawo_autorskie/wiedza.html","af7d7e5d1eddaf05"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/index.html","29dbb785153692e5"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/slajdy-tekst.html","b837ea5132bd901b"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/slajdy.html","8f3ef3eb4ada242d"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/wiedza.html","ccdb0df2c3a456a8"],["moduly/09_przyszlosc_ai/index.html","378b6ac1562a9284"],["moduly/09_przyszlosc_ai/slajdy-tekst.html","c56082497bef731b"],["moduly/09_przyszlosc_ai/slajdy.html","5e8b07889aab67b1"],["moduly/09_przyszlosc_ai/wiedza.html","263e9dfeeaedac09"],["moduly/10_srodowisko_podsumowanie/index.html","b9bb0710eef2c5d0"],["moduly/10_srodowisko_podsumowanie/slajdy-tekst.html","2d859142c16b61f8"],["moduly/10_srodowisko_podsumowanie/slajdy.html","f699d907c521ff84"],["moduly/10_srodowisko_podsumowanie/wiedza.html","3d308e1aa22bd2e5"],["pliki/oswiadczenie_ai.docx","9aa38ee891cb0b2c"],["pliki/sylabus_v2_2026-27.docx","fd07453c75f5c230"],["podziemia.html","1eb4b182f941191a"],["slowniczek.html","c764a52f432b7884"],["styl.html","0c3fe08b1ddd6227"],["sylabus.html","722d0cad9cd7c023"],["zaliczenie.html","512f9e995c89e96e"],["zrodla.html","7f21581d19e18a38"]];   // [ścieżka względem katalogu kursu, skrót treści]
var MEDIA = [["moduly/01_czym_jest_ai/media/01_ai_act_chip.jpg",112139],["moduly/01_czym_jest_ai/media/01_llm_test_turinga_2025.jpg",66326],["moduly/01_czym_jest_ai/media/01_lowca_androidow.jpg",177134],["moduly/01_czym_jest_ai/media/01_midjourney_v1_v6.jpg",77863],["moduly/01_czym_jest_ai/media/01_nawigator_technologiczny.jpg",99107],["moduly/01_czym_jest_ai/media/01_quo_vaidis_dragan.jpg",166503],["moduly/01_czym_jest_ai/media/01_superinteligencja_okladka.jpg",59089],["moduly/01_czym_jest_ai/media/01_szkola_atenska.jpg",60948],["moduly/01_czym_jest_ai/media/01_test_turinga.jpg",268259],["moduly/01_czym_jest_ai/media/01_voight_kampff.jpg",6874],["moduly/01_czym_jest_ai/media/01_w_ai_index_modele_kraje.svg",2994],["moduly/01_czym_jest_ai/media/01_w_eurostat_ai_technologie.svg",8821],["moduly/01_czym_jest_ai/media/01_w_eurostat_genai_wiek.svg",8460],["moduly/01_czym_jest_ai/media/01_w_nask_swiadomosc_genai.svg",4510],["moduly/01_czym_jest_ai/media/01_w_turing_jones_bergen.svg",5537],["moduly/02_historia_ai/media/02_kasparow_1997.jpg",87228],["moduly/02_historia_ai/media/02_lee_sedol_2016.jpg",148767],["moduly/02_historia_ai/media/02_neuron_mcculloch_pitts.svg",4100],["moduly/02_historia_ai/media/02_os_czasu.svg",12803],["moduly/02_historia_ai/media/02_os_czasu_solvatio.jpg",94912],["moduly/02_historia_ai/media/02_perceptron.svg",4444],["moduly/02_historia_ai/media/02_time_series_llm.jpg",71454],["moduly/02_historia_ai/media/02_w_epoch_moc_obliczeniowa.svg",6579],["moduly/02_historia_ai/media/02_w_ilsvrc_2012.svg",5419],["moduly/02_historia_ai/media/02_w_koszt_trenowania.svg",5383],["moduly/02_historia_ai/media/02_w_metr_horyzont.svg",6288],["moduly/02_historia_ai/media/02_w_mollick_metr_th11.svg",8030],["moduly/02_historia_ai/media/02_xor.svg",4795],["moduly/03_podstawy_technologiczne/media/03_agent_petla.svg",5099],["moduly/03_podstawy_technologiczne/media/03_antropomorfizacja.jpg",215775],["moduly/03_podstawy_technologiczne/media/03_c_elegans.jpg",51371],["moduly/03_podstawy_technologiczne/media/03_claude_opus4_atraktor.jpg",208199],["moduly/03_podstawy_technologiczne/media/03_dragon_hatchling.jpg",263298],["moduly/03_podstawy_technologiczne/media/03_etapy_llm.svg",6556],["moduly/03_podstawy_technologiczne/media/03_kalai_2025.jpg",107211],["moduly/03_podstawy_technologiczne/media/03_machine_bullshit.jpg",103615],["moduly/03_podstawy_technologiczne/media/03_mechanizm_uwagi.svg",5058],["moduly/03_podstawy_technologiczne/media/03_microns.jpg",295665],["moduly/03_podstawy_technologiczne/media/03_pasazer_1_pustynia.jpg",195251],["moduly/03_podstawy_technologiczne/media/03_pasazer_2_morze.jpg",180662],["moduly/03_podstawy_technologiczne/media/03_pasazer_3_ciezarowka.jpg",141983],["moduly/03_podstawy_technologiczne/media/03_pasazer_4_samolot.jpg",110807],["moduly/03_podstawy_technologiczne/media/03_reguly_a_dane.svg",5161],["moduly/03_podstawy_technologiczne/media/03_rodzaje_uczenia.svg",6851],["moduly/03_podstawy_technologiczne/media/03_siec_neuronowa.svg",10849],["moduly/03_podstawy_technologiczne/media/03_strachan_2024.jpg",111843],["moduly/03_podstawy_technologiczne/media/03_tokeny.svg",7958],["moduly/03_podstawy_technologiczne/media/03_w_halucynacje_benchmarki.svg",3131],["moduly/03_podstawy_technologiczne/media/03_w_halucynacje_simpleqa.svg",6336],["moduly/03_podstawy_technologiczne/media/03_w_koszt_inferencji.svg",3995],["moduly/03_podstawy_technologiczne/media/03_w_mollick_cena_gpqa.svg",7468],["moduly/03_podstawy_technologiczne/media/03_w_mollick_otwarte_wagi.svg",5034],["moduly/03_podstawy_technologiczne/media/03_w_tokeny_jezyki.svg",4640],["moduly/04_praca_i_edukacja/media/04_bloomberg_rekrutacja.jpg",55759],["moduly/04_praca_i_edukacja/media/04_dellacqua_zasypianie.jpg",102697],["moduly/04_praca_i_edukacja/media/04_dostepnosc_ilustracja.jpg",182891],["moduly/04_praca_i_edukacja/media/04_khan_brave_new_words.jpg",96168],["moduly/04_praca_i_edukacja/media/04_khanmigo.jpg",79470],["moduly/04_praca_i_edukacja/media/04_maria_sklodowska_curie.jpg",102666],["moduly/04_praca_i_edukacja/media/04_mollick_co_intelligence.jpg",181967],["moduly/04_praca_i_edukacja/media/04_w_bcg_poza_granica.svg",4355],["moduly/04_praca_i_edukacja/media/04_w_bcg_w_granicy.svg",3482],["moduly/04_praca_i_edukacja/media/04_w_bcg_wyrownanie.svg",2475],["moduly/04_praca_i_edukacja/media/04_w_eurostat_firmy_kraje.svg",6447],["moduly/04_praca_i_edukacja/media/04_w_eurostat_studenci.svg",7560],["moduly/04_praca_i_edukacja/media/04_w_lawka_plagiat.svg",2979],["moduly/04_praca_i_edukacja/media/04_w_lawka_proznia.svg",5141],["moduly/04_praca_i_edukacja/media/04_w_lawka_wplyw.svg",4734],["moduly/04_praca_i_edukacja/media/04_w_mollick_poszarpana_granica.svg",6920],["moduly/04_praca_i_edukacja/media/04_w_mop_ekspozycja_dochod.svg",3392],["moduly/04_praca_i_edukacja/media/04_w_mop_nask_plec.svg",6740],["moduly/04_praca_i_edukacja/media/04_w_wef_ai_trendy.svg",4720],["moduly/05_etyka_uprzedzenia_moderacja/media/05_auschwitz_moderacja.jpg",47525],["moduly/05_etyka_uprzedzenia_moderacja/media/05_fisher_w_trybach_chaosu.jpg",58953],["moduly/05_etyka_uprzedzenia_moderacja/media/05_gemini_founding_fathers.jpg",116463],["moduly/05_etyka_uprzedzenia_moderacja/media/05_grok_fact_check.jpg",82225],["moduly/05_etyka_uprzedzenia_moderacja/media/05_moloch_abstrakt.jpg",81652],["moduly/05_etyka_uprzedzenia_moderacja/media/05_nist_zdjecia.jpg",28952],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_compas_propublica.svg",4940],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_gender_shades.svg",9732],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_moloch.svg",7821],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_nist_frvt_rozpietosci.svg",4914],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_anamorph_eno.jpg",115151],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_asimov_pozytronowy_czlowiek.jpg",20743],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_black_mirror_nosedive.jpg",100891],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_domingos_wpis.jpg",9994],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_fotografia_generowana.jpg",57997],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_her_plakat.jpg",8592],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_hidden_games_okladka.jpg",24433],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_kod_kreatywnosci_okladka.jpg",60393],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_midjourney_v1_v6.jpg",80065],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_pllum_baner.jpg",49919],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_red_flag_dormans.jpg",94737],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_szum_okladka.jpg",49815],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_common_crawl_jezyki.svg",7626],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_lokalizacja_danych_regiony.svg",5611],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_ultimatum_spolecznosci.svg",7948],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_ustawy_ai_g20.svg",9149],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_zaufanie_regulacja_kraje.svg",10845],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_procedura_wysokie_ryzyko.jpg",30188],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_bartz_odszkodowanie_za_dzielo.svg",5435],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_harmonogram.svg",8886],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_kary_art99.svg",4608],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_piramida_ryzyka.svg",4646],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_halucynacje_baza_charlotina.svg",9059],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_kary_organow_ochrony_danych_ai.svg",5603],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_sedziowie_usa_czestosc_uzycia_ai.svg",3940],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_toga_czestotliwosc.svg",4230],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_toga_nfc.svg",6988],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_toga_obszary.svg",4386],["moduly/09_przyszlosc_ai/media/09_ai_2027.jpg",65585],["moduly/09_przyszlosc_ai/media/09_alignment_hi_ai.jpg",58966],["moduly/09_przyszlosc_ai/media/09_apokalipsa_zbawienie.jpg",234207],["moduly/09_przyszlosc_ai/media/09_bloomberg_powiazania.jpg",165351],["moduly/09_przyszlosc_ai/media/09_co_intelligence.jpg",181967],["moduly/09_przyszlosc_ai/media/09_coeckelbergh.jpg",57269],["moduly/09_przyszlosc_ai/media/09_coming_wave.jpg",162941],["moduly/09_przyszlosc_ai/media/09_converging_minds.jpg",90461],["moduly/09_przyszlosc_ai/media/09_deep_utopia.jpg",64213],["moduly/09_przyszlosc_ai/media/09_haymarket_1886.jpg",79926],["moduly/09_przyszlosc_ai/media/09_jesli_ktos_to_zbuduje.jpg",78329],["moduly/09_przyszlosc_ai/media/09_nadella_world_as_prompt.jpg",55633],["moduly/09_przyszlosc_ai/media/09_osobliwosc.jpg",207730],["moduly/09_przyszlosc_ai/media/09_pkb_dlugie_trwanie.jpg",37668],["moduly/09_przyszlosc_ai/media/09_prawo_moorea_owid.jpg",72132],["moduly/09_przyszlosc_ai/media/09_strajk_wga_2023.jpg",141993],["moduly/09_przyszlosc_ai/media/09_superintelligence_sowa.jpg",76798],["moduly/09_przyszlosc_ai/media/09_think_for_me.jpg",10577],["moduly/09_przyszlosc_ai/media/09_uzytkownicy_1m_100m.jpg",33706],["moduly/09_przyszlosc_ai/media/09_w_ankieta_ekspertow.svg",6477],["moduly/09_przyszlosc_ai/media/09_w_hanson_podwajanie_gospodarki.svg",6120],["moduly/09_przyszlosc_ai/media/09_w_krzywa_gartnera.svg",7051],["moduly/09_przyszlosc_ai/media/09_w_masai_wzgledne.svg",5358],["moduly/09_przyszlosc_ai/media/09_w_mollick_eci_liderzy.svg",8240],["moduly/09_przyszlosc_ai/media/09_w_mollick_spadek_cen_technologie.svg",5107],["moduly/09_przyszlosc_ai/media/09_w_parametry_modeli.svg",7756],["moduly/09_przyszlosc_ai/media/09_w_robodebt_kwoty.svg",3950],["moduly/09_przyszlosc_ai/media/09_w_tranzystory.svg",7629],["moduly/09_przyszlosc_ai/media/09_zolta_rzeka.jpg",44931],["moduly/10_srodowisko_podsumowanie/media/10_atlas_ai.jpg",23573],["moduly/10_srodowisko_podsumowanie/media/10_co_dalej.jpg",191374],["moduly/10_srodowisko_podsumowanie/media/10_cyna_gornicy.jpg",93355],["moduly/10_srodowisko_podsumowanie/media/10_cyna_mapa.jpg",6002],["moduly/10_srodowisko_podsumowanie/media/10_gutaperka_drzewo.jpg",143540],["moduly/10_srodowisko_podsumowanie/media/10_hardware_software.jpg",258099],["moduly/10_srodowisko_podsumowanie/media/10_kongo_mapa.jpg",6112],["moduly/10_srodowisko_podsumowanie/media/10_koszty_srodowiskowe.jpg",265208],["moduly/10_srodowisko_podsumowanie/media/10_krwawy_kobalt.jpg",62682],["moduly/10_srodowisko_podsumowanie/media/10_lit.jpg",42776],["moduly/10_srodowisko_podsumowanie/media/10_metale_ziem_rzadkich.jpg",35462],["moduly/10_srodowisko_podsumowanie/media/10_palaquium_gutta.jpg",40247],["moduly/10_srodowisko_podsumowanie/media/10_slad_wodny.jpg",292266],["moduly/10_srodowisko_podsumowanie/media/10_sokrates_woda.jpg",64448],["moduly/10_srodowisko_podsumowanie/media/10_w_emisje_microsoft_google.svg",5254],["moduly/10_srodowisko_podsumowanie/media/10_w_energia_na_zapytanie.svg",5142],["moduly/10_srodowisko_podsumowanie/media/10_w_iea_centra_danych.svg",5267],["moduly/10_srodowisko_podsumowanie/media/10_w_iea_wzrost_regiony.svg",3581],["moduly/10_srodowisko_podsumowanie/media/10_w_irlandia_centra_danych.svg",8129],["moduly/10_srodowisko_podsumowanie/media/10_w_koncentracja_wydobycia_surowcow.svg",4651],["moduly/10_srodowisko_podsumowanie/media/10_w_woda_na_odpowiedz.svg",5341],["moduly/10_srodowisko_podsumowanie/media/10_zuckerberg_podcast.jpg",43589]];       // [ścieżka, rozmiar w bajtach]
var ZEWN = ["https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/simple.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/search/search.js", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/zoom/zoom.js", "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap", "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@300;400;500;600;700;800&display=swap", "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Manrope:wght@400;500;600;700&display=swap", "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Tiny5&family=Chakra+Petch:wght@500;600;700&family=Anton&family=VT323&display=swap"];         // adresy CDN używane przez slajdy
var C_POWLOKA = "neo-powloka-" + WERSJA;
var C_MEDIA = "neo-media";
var C_ZEWN = "neo-zewn";
var C_REV = "neo-rev";
var LIMIT_MS = 4000;
var BAZA = new URL("./", self.location).href;

function adres(p) { return new URL(p, BAZA).href; }
function klucz(url) {
  var u = new URL(url);
  u.search = ""; u.hash = "";
  if (u.pathname.slice(-1) === "/") u.pathname += "index.html";
  return u.href;
}
var W_MEDIA = {};
MEDIA.forEach(function (m) { W_MEDIA[adres(m[0])] = true; });

self.addEventListener("install", function (e) {
  e.waitUntil((async function () {
    var nowa = await caches.open(C_POWLOKA);
    var rev = await caches.open(C_REV);
    var staraRev = {};
    try { var r = await rev.match("rev.json"); if (r) staraRev = await r.json(); } catch (x) {}
    var stare = (await caches.keys()).filter(function (k) { return k.indexOf("neo-powloka-") === 0 && k !== C_POWLOKA; });
    var doPobrania = [];
    for (var i = 0; i < POWLOKA.length; i++) {
      var url = adres(POWLOKA[i][0]), skrot = POWLOKA[i][1], jest = null;
      if (staraRev[url] === skrot) {
        for (var j = 0; j < stare.length && !jest; j++) jest = await (await caches.open(stare[j])).match(url);
      }
      if (jest) await nowa.put(url, jest); else doPobrania.push(url);
    }
    await nowa.addAll(doPobrania.map(function (u) { return new Request(u, { cache: "reload" }); }));
    var mapa = {};
    POWLOKA.forEach(function (p) { mapa[adres(p[0])] = p[1]; });
    await rev.put("rev.json", new Response(JSON.stringify(mapa), { headers: { "content-type": "application/json" } }));
    var z = await caches.open(C_ZEWN);
    await Promise.all(ZEWN.map(async function (u) {
      try { if (!(await z.match(u))) { var o = await fetch(u, { mode: "cors" }); if (o.ok) await z.put(u, o); } } catch (x) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k.indexOf("neo-powloka-") === 0 && k !== C_POWLOKA; })
      .map(function (k) { return caches.delete(k); }));
    var m = await caches.open(C_MEDIA);
    var zapisane = await m.keys();
    await Promise.all(zapisane.filter(function (r) { return !W_MEDIA[r.url]; }).map(function (r) { return m.delete(r); }));
    await self.clients.claim();
  })());
});

function zLimitem(p, ms) {
  return new Promise(function (ok, zle) {
    var t = setTimeout(function () { zle(new Error("limit")); }, ms);
    p.then(function (r) { clearTimeout(t); ok(r); }, function (x) { clearTimeout(t); zle(x); });
  });
}

// Strona podana z pamięci dostaje znacznik, po którym ui.js pokazuje pasek „wersja zapisana”.
async function oznacz(res) {
  if (!res || (res.headers.get("content-type") || "").indexOf("text/html") === -1) return res;
  var t = await res.text();
  t = t.replace(/<html(\s|>)/, '<html data-z-pamieci="1"$1');
  return new Response(t, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

function brakStrony() {
  var h = '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Brak połączenia</title><style>body{background:#07080f;color:#e8eaf2;font:17px/1.5 system-ui,sans-serif;margin:0;padding:24px}' +
    'a{color:#fcee0a}main{max-width:36em;margin:10vh auto}</style></head><body><main><h1>Brak połączenia</h1>' +
    '<p>Ta strona nie została jeszcze zapisana w pamięci urządzenia. Zapisane są strony kursu odwiedzone wcześniej lub pobrane przy pierwszej wizycie.</p>' +
    '<p><a href="' + adres("index.html") + '">Wróć na mapę kursu</a></p></main></body></html>';
  return new Response(h, { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
}

// najpierw sieć (z limitem czasu), przy porażce pamięć; udana odpowiedź odświeża pamięć
async function siecPotemPamiec(e, nazwa, strona) {
  var k = klucz(e.request.url);
  // cache: "no-cache" = zawsze pytamy serwer (tanie 304, gdy nic się nie zmieniło), bez starych kopii z pamięci przeglądarki
  var siec = fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).then(async function (r) {
    if (r.redirected) r = new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers });
    if (r && r.ok) { var c = await caches.open(nazwa); await c.put(k, r.clone()); }
    return r;
  });
  e.waitUntil(siec.catch(function () {}));
  try {
    var r = await zLimitem(siec, LIMIT_MS);
    if (r.ok || r.status === 404) return r;
    throw new Error("status " + r.status);
  } catch (x) {
    var z = await caches.match(k);
    if (z) return strona ? oznacz(z) : z;
    if (strona) return brakStrony();
    return siec;
  }
}

// najpierw pamięć, w tle odświeżenie (ilustracje)
async function pamiecPotemSiec(e, nazwa) {
  var k = klucz(e.request.url);
  var c = await caches.open(nazwa);
  var z = await c.match(k);
  var siec = fetch(e.request).then(async function (r) { if (r && r.ok) await c.put(k, r.clone()); return r; });
  if (z) { e.waitUntil(siec.catch(function () {})); return z; }
  return siec;
}

// CDN: adresy z numerem wersji, więc wystarczy pamięć z dopisaniem przy pierwszym użyciu
async function zewnetrzne(e) {
  var c = await caches.open(C_ZEWN);
  var z = await c.match(e.request.url);
  if (z) return z;
  var r = await fetch(e.request);
  if (r && (r.ok || r.type === "opaque")) await c.put(e.request.url, r.clone());
  return r;
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.href.indexOf(BAZA) !== 0) return;
    if (W_MEDIA[klucz(url.href)]) { e.respondWith(pamiecPotemSiec(e, C_MEDIA)); return; }
    e.respondWith(siecPotemPamiec(e, C_POWLOKA, req.mode === "navigate"));
    return;
  }
  if (/^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) e.respondWith(zewnetrzne(e));
});

// rozmowa ze stroną: stan pamięci i „zapisz cały kurs”
self.addEventListener("message", function (e) {
  var d = e.data || {}, src = e.source;
  if (d.typ === "stan") {
    e.waitUntil((async function () {
      var m = await caches.open(C_MEDIA), n = 0, bajty = 0, brak = 0;
      for (var i = 0; i < MEDIA.length; i++) {
        bajty += MEDIA[i][1];
        if (await m.match(adres(MEDIA[i][0]))) n++; else brak += MEDIA[i][1];
      }
      src.postMessage({ typ: "stan", stan: STAN, media: MEDIA.length, zapisane: n, bajty: bajty, brak: brak });
    })());
  } else if (d.typ === "zapisz-wszystko") {
    e.waitUntil((async function () {
      var m = await caches.open(C_MEDIA), gotowe = 0, bledy = 0;
      for (var i = 0; i < MEDIA.length; i++) {
        var u = adres(MEDIA[i][0]);
        try { if (!(await m.match(u))) { var r = await fetch(u); if (r.ok) await m.put(u, r); else bledy++; } } catch (x) { bledy++; }
        gotowe++;
        if (gotowe % 5 === 0 || gotowe === MEDIA.length) src.postMessage({ typ: "postep", gotowe: gotowe, razem: MEDIA.length, bledy: bledy });
      }
    })());
  }
});
