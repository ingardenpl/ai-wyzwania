/* NEO-LUBLIN 2049: tryb offline (service worker). Plik generuje tools/build.py z szablonu tools/szablony/sw.js.
   Zasada: przy połączeniu strona zawsze idzie z sieci (świeże terminy i materiały), pamięć urządzenia
   służy tylko wtedy, gdy sieci nie ma albo odpowiada dłużej niż kilka sekund.
   - powłoka (HTML, CSS, JS, SVG, ikony, aplikacje, pliki): zapisywana przy pierwszej wizycie; niezmienione pliki
     przechodzą do nowej wersji bez ponownego pobierania (porównanie skrótów z REV);
   - ilustracje z media/: zapisywane po obejrzeniu albo na żądanie („zapisz cały kurs”), usuwane, gdy znikną z kursu;
   - reveal.js i fonty z CDN: zapisywane przy pierwszym użyciu (adresy z wersją, więc się nie starzeją). */
"use strict";
var WERSJA = "dfd6783d2446";
var STAN = "27.10.2026";
var POWLOKA = [["404.html","a5730bb1cc4ba349"],["assets/baner.svg","2d9773d8cae1a749"],["assets/certyfikat.js","5017c1a3ff35f4e8"],["assets/eksploracja.css","6baf849c7e64c86a"],["assets/eksploracja.js","51a7b711b104d913"],["assets/fiszki.js","374a2d70ff5fdb1f"],["assets/gra.js","85097b180b69b947"],["assets/i18n-en.js","3dfb9bea453afb40"],["assets/ikona-180.png","8c51eab6890d5e3e"],["assets/ikona-192.png","728dcfe46221253b"],["assets/ikona-512.png","818680314987329d"],["assets/jajka.js","6cf42f9e3491c640"],["assets/kalendarz.js","cb798cd9f9a0faaf"],["assets/kalendarz_en.js","2abe8024b3bc295c"],["assets/manifest.webmanifest","e5d0308792c673b9"],["assets/miasto.js","a0934828048f3309"],["assets/podziemia.js","50d201da4332d4fd"],["assets/przewodnik.js","faa1385d4ef6d47e"],["assets/quiz.js","9abf144a77a6f3d2"],["assets/radio.js","94f44e5c65611be0"],["assets/site.js","374b5dc5627a1850"],["assets/slajdy.css","fd3d234aca3bc4ea"],["assets/slajdy_neon.css","fd4ee5e6c6fd041d"],["assets/stare_miasto.js","94910beaf0f245ae"],["assets/style.css","54cfa96517219249"],["assets/ui.js","4ccd80d1941b8e08"],["assets/wnetrze.js","cc89387421bf57eb"],["biblioteka.html","adcab4a91d7c744f"],["certyfikat.html","236d16e040642936"],["en/404.html","938a743d318b5fc6"],["en/biblioteka.html","b98f40d34ce11c9a"],["en/certyfikat.html","e83593754d8778c5"],["en/fiszki.html","7daa14141f2617a9"],["en/index.html","77b224bb1552c51b"],["en/interaktywne.html","6b55026124b8e7bc"],["en/moduly/01_czym_jest_ai/index.html","610c1706b12c3c36"],["en/moduly/01_czym_jest_ai/slajdy-tekst.html","7adc5a3c5e74fa73"],["en/moduly/01_czym_jest_ai/slajdy.html","85c0d182d6d0a0a5"],["en/moduly/01_czym_jest_ai/wiedza.html","66b093ad56680398"],["en/moduly/02_historia_ai/index.html","880eb00f71fdf2b4"],["en/moduly/03_podstawy_technologiczne/index.html","9a1d8876c1e909a4"],["en/moduly/04_praca_i_edukacja/index.html","242cfbc78e21dbb9"],["en/moduly/05_etyka_uprzedzenia_moderacja/index.html","d0e45ea9adf32851"],["en/moduly/06_kultura_regulacja_jezyk_sztuka/index.html","b08c8f4908808e08"],["en/moduly/07_prawo_I_regulacje_prawo_autorskie/index.html","eca41c94c16c3dfe"],["en/moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/index.html","a32b999f2f1d0eaf"],["en/moduly/09_przyszlosc_ai/index.html","8ae90a45107af1b1"],["en/moduly/10_srodowisko_podsumowanie/index.html","dd1443dc0c4786c5"],["en/nauka.html","93b1ebf32e5f9b3c"],["en/pliki/oswiadczenie_ai.docx","e77fbbf4d5393220"],["en/pliki/sylabus_v2_2026-27.docx","2dc57d71a4a0a689"],["en/podziemia.html","234e10f960694411"],["en/slowniczek.html","6f68dde9b283b0ad"],["en/styl.html","48c643c20dc7a789"],["en/sylabus.html","251329cdcfcc36e4"],["en/zaliczenie.html","ac05fcbe9fb12d50"],["en/zrodla.html","0612a2fcad19d387"],["fiszki.html","b5655aab79c8f5b8"],["index.html","19da2f85a638b385"],["interaktywne/algorytm_w_lawce_szkolnej.html","b23c4c6ed1b12b7f"],["interaktywne/algorytm_w_todze.html","ec776d1aadb855c8"],["interaktywne/algorytm_w_todze_prezentacja.html","ab0483a63c61d70d"],["interaktywne/demo_tokeny.html","5c029e07dfba4bad"],["interaktywne/kalkulator_sladu.html","be9b45a47d61c0df"],["interaktywne/klasyfikator_ryzyka_ai_act.html","8c3747746cf6b19a"],["interaktywne/macierz_wyplat.html","7e46eb0c6af6a3ea"],["interaktywne/os_czasu_ai.html","ab1327ad08f1d2e7"],["interaktywne/sonda_prognozy.html","0885de41ffabafa0"],["interaktywne/symulator_stronniczosci.html","771cb04f372acbd8"],["interaktywne.html","0ebc02d095308388"],["moduly/01_czym_jest_ai/index.html","48a43a8f1c410cc1"],["moduly/01_czym_jest_ai/slajdy-tekst.html","62bcc91a13bd0ed6"],["moduly/01_czym_jest_ai/slajdy.html","af85c09f632b2338"],["moduly/01_czym_jest_ai/wiedza.html","082bf523d898f7a1"],["moduly/02_historia_ai/index.html","fd4807e9b6eb21f4"],["moduly/02_historia_ai/slajdy-tekst.html","87ea79e91d63a057"],["moduly/02_historia_ai/slajdy.html","f1443effa9bb61e5"],["moduly/02_historia_ai/wiedza.html","74692f27118864b5"],["moduly/03_podstawy_technologiczne/index.html","c278a3bce0f407f9"],["moduly/03_podstawy_technologiczne/slajdy-tekst.html","d2dae59d65c68b96"],["moduly/03_podstawy_technologiczne/slajdy.html","6d248a982707e854"],["moduly/03_podstawy_technologiczne/slajdy_proba.html","578cba36a1584cdc"],["moduly/03_podstawy_technologiczne/wiedza.html","354992080389761a"],["moduly/04_praca_i_edukacja/index.html","744bd3545e6a38e3"],["moduly/04_praca_i_edukacja/slajdy-tekst.html","4eabe2fb71a539b4"],["moduly/04_praca_i_edukacja/slajdy.html","ea16c1051f9cc5c9"],["moduly/04_praca_i_edukacja/wiedza.html","a15181dbdacbfdca"],["moduly/05_etyka_uprzedzenia_moderacja/index.html","8be8e5b9970b1f0f"],["moduly/05_etyka_uprzedzenia_moderacja/slajdy-tekst.html","ec26da352f61499b"],["moduly/05_etyka_uprzedzenia_moderacja/slajdy.html","50a0eb7932330641"],["moduly/05_etyka_uprzedzenia_moderacja/wiedza.html","c6ffee870191c2c2"],["moduly/06_kultura_regulacja_jezyk_sztuka/index.html","f3adddd7d26f789b"],["moduly/06_kultura_regulacja_jezyk_sztuka/slajdy-tekst.html","d641ae03255ef8d5"],["moduly/06_kultura_regulacja_jezyk_sztuka/slajdy.html","0bb0fa38f57aeb94"],["moduly/06_kultura_regulacja_jezyk_sztuka/wiedza.html","86e725e3ceae4552"],["moduly/07_prawo_I_regulacje_prawo_autorskie/index.html","ae664a822561bc4c"],["moduly/07_prawo_I_regulacje_prawo_autorskie/slajdy-tekst.html","a33de9577b6e7c71"],["moduly/07_prawo_I_regulacje_prawo_autorskie/slajdy.html","fef4bda4962c75ed"],["moduly/07_prawo_I_regulacje_prawo_autorskie/wiedza.html","a4e99b0231dba821"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/index.html","74714c66014172fe"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/slajdy-tekst.html","d6b567bcbdb044e7"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/slajdy.html","b5070a9825668166"],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/wiedza.html","5309a491aa8cd8e0"],["moduly/09_przyszlosc_ai/index.html","2c2581855995b76e"],["moduly/09_przyszlosc_ai/slajdy-tekst.html","dbf77ffd5663f37b"],["moduly/09_przyszlosc_ai/slajdy.html","04977b416715e072"],["moduly/09_przyszlosc_ai/wiedza.html","dda7f8ac88a518fb"],["moduly/10_srodowisko_podsumowanie/index.html","80d474444ab79c01"],["moduly/10_srodowisko_podsumowanie/slajdy-tekst.html","30eaaf0d966a3052"],["moduly/10_srodowisko_podsumowanie/slajdy.html","e332d83550753677"],["moduly/10_srodowisko_podsumowanie/wiedza.html","8769baa327c422b6"],["nauka.html","0b43f9e78b5506ea"],["pliki/oswiadczenie_ai.docx","6fa3a2b1fbbd16a2"],["pliki/sylabus_v2_2026-27.docx","276f6d015ec5cecb"],["podziemia.html","3068745d8c246323"],["slowniczek.html","bf682bfd090a6226"],["styl.html","42e939374a47387b"],["sylabus.html","3ecc5f566686017e"],["zaliczenie.html","126580f46ef2836b"],["zrodla.html","5d8fa238aab2ad74"]];   // [ścieżka względem katalogu kursu, skrót treści]
var MEDIA = [["moduly/01_czym_jest_ai/media/01_ai_act_chip.jpg",112139],["moduly/01_czym_jest_ai/media/01_llm_test_turinga_2025.jpg",66326],["moduly/01_czym_jest_ai/media/01_lowca_androidow.jpg",177134],["moduly/01_czym_jest_ai/media/01_midjourney_v1_v6.jpg",77863],["moduly/01_czym_jest_ai/media/01_nawigator_technologiczny.jpg",99107],["moduly/01_czym_jest_ai/media/01_quo_vaidis_dragan.jpg",166503],["moduly/01_czym_jest_ai/media/01_superinteligencja_okladka.jpg",59089],["moduly/01_czym_jest_ai/media/01_szkola_atenska.jpg",60948],["moduly/01_czym_jest_ai/media/01_test_turinga.jpg",268259],["moduly/01_czym_jest_ai/media/01_voight_kampff.jpg",6874],["moduly/01_czym_jest_ai/media/01_w_ai_index_modele_kraje.svg",2994],["moduly/01_czym_jest_ai/media/01_w_eurostat_ai_technologie.svg",8821],["moduly/01_czym_jest_ai/media/01_w_eurostat_genai_wiek.svg",8460],["moduly/01_czym_jest_ai/media/01_w_nask_swiadomosc_genai.svg",4510],["moduly/01_czym_jest_ai/media/01_w_turing_jones_bergen.svg",5537],["moduly/02_historia_ai/media/02_kasparow_1997.jpg",87228],["moduly/02_historia_ai/media/02_lee_sedol_2016.jpg",148767],["moduly/02_historia_ai/media/02_neuron_mcculloch_pitts.svg",4066],["moduly/02_historia_ai/media/02_os_czasu.svg",12686],["moduly/02_historia_ai/media/02_os_czasu_solvatio.jpg",94912],["moduly/02_historia_ai/media/02_perceptron.svg",4407],["moduly/02_historia_ai/media/02_time_series_llm.jpg",71454],["moduly/02_historia_ai/media/02_w_epoch_moc_obliczeniowa.svg",6579],["moduly/02_historia_ai/media/02_w_ilsvrc_2012.svg",5419],["moduly/02_historia_ai/media/02_w_koszt_trenowania.svg",5383],["moduly/02_historia_ai/media/02_w_metr_horyzont.svg",6288],["moduly/02_historia_ai/media/02_w_mollick_metr_th11.svg",8030],["moduly/02_historia_ai/media/02_xor.svg",4757],["moduly/03_podstawy_technologiczne/media/03_agent_petla.svg",5058],["moduly/03_podstawy_technologiczne/media/03_antropomorfizacja.jpg",215775],["moduly/03_podstawy_technologiczne/media/03_c_elegans.jpg",51371],["moduly/03_podstawy_technologiczne/media/03_claude_opus4_atraktor.jpg",208199],["moduly/03_podstawy_technologiczne/media/03_dragon_hatchling.jpg",263298],["moduly/03_podstawy_technologiczne/media/03_etapy_llm.svg",6504],["moduly/03_podstawy_technologiczne/media/03_kalai_2025.jpg",107211],["moduly/03_podstawy_technologiczne/media/03_machine_bullshit.jpg",103615],["moduly/03_podstawy_technologiczne/media/03_mechanizm_uwagi.svg",5018],["moduly/03_podstawy_technologiczne/media/03_microns.jpg",295665],["moduly/03_podstawy_technologiczne/media/03_pasazer_1_pustynia.jpg",195251],["moduly/03_podstawy_technologiczne/media/03_pasazer_2_morze.jpg",180662],["moduly/03_podstawy_technologiczne/media/03_pasazer_3_ciezarowka.jpg",141983],["moduly/03_podstawy_technologiczne/media/03_pasazer_4_samolot.jpg",110807],["moduly/03_podstawy_technologiczne/media/03_reguly_a_dane.svg",5119],["moduly/03_podstawy_technologiczne/media/03_rodzaje_uczenia.svg",6795],["moduly/03_podstawy_technologiczne/media/03_siec_neuronowa.svg",10735],["moduly/03_podstawy_technologiczne/media/03_strachan_2024.jpg",111843],["moduly/03_podstawy_technologiczne/media/03_tokeny.svg",7892],["moduly/03_podstawy_technologiczne/media/03_w_halucynacje_benchmarki.svg",3131],["moduly/03_podstawy_technologiczne/media/03_w_halucynacje_simpleqa.svg",6336],["moduly/03_podstawy_technologiczne/media/03_w_koszt_inferencji.svg",3995],["moduly/03_podstawy_technologiczne/media/03_w_mollick_cena_gpqa.svg",7468],["moduly/03_podstawy_technologiczne/media/03_w_mollick_otwarte_wagi.svg",5034],["moduly/03_podstawy_technologiczne/media/03_w_tokeny_jezyki.svg",4640],["moduly/04_praca_i_edukacja/media/04_bloomberg_rekrutacja.jpg",55759],["moduly/04_praca_i_edukacja/media/04_dellacqua_zasypianie.jpg",102697],["moduly/04_praca_i_edukacja/media/04_dostepnosc_ilustracja.jpg",182891],["moduly/04_praca_i_edukacja/media/04_khan_brave_new_words.jpg",96168],["moduly/04_praca_i_edukacja/media/04_khanmigo.jpg",79470],["moduly/04_praca_i_edukacja/media/04_maria_sklodowska_curie.jpg",102666],["moduly/04_praca_i_edukacja/media/04_mollick_co_intelligence.jpg",181967],["moduly/04_praca_i_edukacja/media/04_w_atlas_plytko.svg",3675],["moduly/04_praca_i_edukacja/media/04_w_bcg_poza_granica.svg",4355],["moduly/04_praca_i_edukacja/media/04_w_bcg_w_granicy.svg",3482],["moduly/04_praca_i_edukacja/media/04_w_bcg_wyrownanie.svg",2475],["moduly/04_praca_i_edukacja/media/04_w_eurostat_firmy_kraje.svg",6447],["moduly/04_praca_i_edukacja/media/04_w_eurostat_studenci.svg",7560],["moduly/04_praca_i_edukacja/media/04_w_lawka_plagiat.svg",2979],["moduly/04_praca_i_edukacja/media/04_w_lawka_proznia.svg",5141],["moduly/04_praca_i_edukacja/media/04_w_lawka_wplyw.svg",4734],["moduly/04_praca_i_edukacja/media/04_w_mollick_poszarpana_granica.svg",6920],["moduly/04_praca_i_edukacja/media/04_w_mop_ekspozycja_dochod.svg",3392],["moduly/04_praca_i_edukacja/media/04_w_mop_nask_plec.svg",6740],["moduly/04_praca_i_edukacja/media/04_w_wef_ai_trendy.svg",4720],["moduly/05_etyka_uprzedzenia_moderacja/media/05_auschwitz_moderacja.jpg",47525],["moduly/05_etyka_uprzedzenia_moderacja/media/05_fisher_w_trybach_chaosu.jpg",58953],["moduly/05_etyka_uprzedzenia_moderacja/media/05_gemini_founding_fathers.jpg",116463],["moduly/05_etyka_uprzedzenia_moderacja/media/05_grok_fact_check.jpg",82225],["moduly/05_etyka_uprzedzenia_moderacja/media/05_moloch_abstrakt.jpg",81652],["moduly/05_etyka_uprzedzenia_moderacja/media/05_nist_zdjecia.jpg",28952],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_compas_propublica.svg",4940],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_gender_shades.svg",9732],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_moloch.svg",7821],["moduly/05_etyka_uprzedzenia_moderacja/media/05_w_nist_frvt_rozpietosci.svg",4914],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_anamorph_eno.jpg",115151],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_asimov_pozytronowy_czlowiek.jpg",20743],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_black_mirror_nosedive.jpg",100891],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_domingos_wpis.jpg",9994],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_fotografia_generowana.jpg",57997],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_her_plakat.jpg",8592],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_hidden_games_okladka.jpg",24433],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_kod_kreatywnosci_okladka.jpg",60393],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_midjourney_v1_v6.jpg",80065],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_pllum_baner.jpg",49919],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_red_flag_dormans.jpg",94737],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_szum_okladka.jpg",49815],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_common_crawl_jezyki.svg",7626],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_lokalizacja_danych_regiony.svg",5611],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_ultimatum_spolecznosci.svg",7948],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_ustawy_ai_g20.svg",9149],["moduly/06_kultura_regulacja_jezyk_sztuka/media/06_w_zaufanie_regulacja_kraje.svg",10845],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_procedura_wysokie_ryzyko.jpg",30188],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_bartz_odszkodowanie_za_dzielo.svg",5435],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_harmonogram.svg",8886],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_kary_art99.svg",4608],["moduly/07_prawo_I_regulacje_prawo_autorskie/media/07_w_piramida_ryzyka.svg",4646],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_halucynacje_baza_charlotina.svg",9059],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_kary_organow_ochrony_danych_ai.svg",5603],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_sedziowie_usa_czestosc_uzycia_ai.svg",3940],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_toga_czestotliwosc.svg",4230],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_toga_nfc.svg",6988],["moduly/08_prawo_II_dane_odpowiedzialnosc_wymiar_sprawiedliwosci/media/08_w_toga_obszary.svg",4386],["moduly/09_przyszlosc_ai/media/09_ai_2027.jpg",65585],["moduly/09_przyszlosc_ai/media/09_alignment_hi_ai.jpg",58966],["moduly/09_przyszlosc_ai/media/09_apokalipsa_zbawienie.jpg",234207],["moduly/09_przyszlosc_ai/media/09_bloomberg_powiazania.jpg",165351],["moduly/09_przyszlosc_ai/media/09_co_intelligence.jpg",181967],["moduly/09_przyszlosc_ai/media/09_coeckelbergh.jpg",57269],["moduly/09_przyszlosc_ai/media/09_coming_wave.jpg",162941],["moduly/09_przyszlosc_ai/media/09_converging_minds.jpg",90461],["moduly/09_przyszlosc_ai/media/09_deep_utopia.jpg",64213],["moduly/09_przyszlosc_ai/media/09_haymarket_1886.jpg",79926],["moduly/09_przyszlosc_ai/media/09_jesli_ktos_to_zbuduje.jpg",78329],["moduly/09_przyszlosc_ai/media/09_nadella_world_as_prompt.jpg",55633],["moduly/09_przyszlosc_ai/media/09_osobliwosc.jpg",207730],["moduly/09_przyszlosc_ai/media/09_pkb_dlugie_trwanie.jpg",37668],["moduly/09_przyszlosc_ai/media/09_prawo_moorea_owid.jpg",72132],["moduly/09_przyszlosc_ai/media/09_strajk_wga_2023.jpg",141993],["moduly/09_przyszlosc_ai/media/09_superintelligence_sowa.jpg",76798],["moduly/09_przyszlosc_ai/media/09_think_for_me.jpg",10577],["moduly/09_przyszlosc_ai/media/09_uzytkownicy_1m_100m.jpg",33706],["moduly/09_przyszlosc_ai/media/09_w_ankieta_ekspertow.svg",6477],["moduly/09_przyszlosc_ai/media/09_w_hanson_podwajanie_gospodarki.svg",6120],["moduly/09_przyszlosc_ai/media/09_w_krzywa_gartnera.svg",7051],["moduly/09_przyszlosc_ai/media/09_w_masai_wzgledne.svg",5358],["moduly/09_przyszlosc_ai/media/09_w_mollick_eci_liderzy.svg",8240],["moduly/09_przyszlosc_ai/media/09_w_mollick_spadek_cen_technologie.svg",5107],["moduly/09_przyszlosc_ai/media/09_w_parametry_modeli.svg",7756],["moduly/09_przyszlosc_ai/media/09_w_robodebt_kwoty.svg",3950],["moduly/09_przyszlosc_ai/media/09_w_tranzystory.svg",7629],["moduly/09_przyszlosc_ai/media/09_zolta_rzeka.jpg",44931],["moduly/10_srodowisko_podsumowanie/media/10_atlas_ai.jpg",23573],["moduly/10_srodowisko_podsumowanie/media/10_co_dalej.jpg",191374],["moduly/10_srodowisko_podsumowanie/media/10_cyna_gornicy.jpg",93355],["moduly/10_srodowisko_podsumowanie/media/10_cyna_mapa.jpg",6002],["moduly/10_srodowisko_podsumowanie/media/10_gutaperka_drzewo.jpg",143540],["moduly/10_srodowisko_podsumowanie/media/10_hardware_software.jpg",258099],["moduly/10_srodowisko_podsumowanie/media/10_kongo_mapa.jpg",6112],["moduly/10_srodowisko_podsumowanie/media/10_koszty_srodowiskowe.jpg",265208],["moduly/10_srodowisko_podsumowanie/media/10_krwawy_kobalt.jpg",62682],["moduly/10_srodowisko_podsumowanie/media/10_lit.jpg",42776],["moduly/10_srodowisko_podsumowanie/media/10_metale_ziem_rzadkich.jpg",35462],["moduly/10_srodowisko_podsumowanie/media/10_palaquium_gutta.jpg",40247],["moduly/10_srodowisko_podsumowanie/media/10_slad_wodny.jpg",292266],["moduly/10_srodowisko_podsumowanie/media/10_sokrates_woda.jpg",64448],["moduly/10_srodowisko_podsumowanie/media/10_w_emisje_microsoft_google.svg",5254],["moduly/10_srodowisko_podsumowanie/media/10_w_energia_na_zapytanie.svg",5142],["moduly/10_srodowisko_podsumowanie/media/10_w_iea_centra_danych.svg",5267],["moduly/10_srodowisko_podsumowanie/media/10_w_iea_wzrost_regiony.svg",3581],["moduly/10_srodowisko_podsumowanie/media/10_w_irlandia_centra_danych.svg",8129],["moduly/10_srodowisko_podsumowanie/media/10_w_koncentracja_wydobycia_surowcow.svg",4651],["moduly/10_srodowisko_podsumowanie/media/10_w_woda_na_odpowiedz.svg",5341],["moduly/10_srodowisko_podsumowanie/media/10_zuckerberg_podcast.jpg",43589]];       // [ścieżka, rozmiar w bajtach]
var ZEWN = ["https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/simple.css", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/search/search.js", "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/zoom/zoom.js", "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap", "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@300;400;500;600;700;800&display=swap", "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Manrope:wght@400;500;600;700&display=swap", "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Tiny5&family=Chakra+Petch:wght@500;600;700&family=Anton&family=VT323&display=swap"];         // adresy CDN używane przez slajdy
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

// CDN i fonty: z pamięci od razu, a w tle odświeżenie (stale-while-revalidate). Odpowiedzi „opaque” (fonty bez CORS)
// nie mają statusu, więc odświeżamy je przy każdym połączeniu: jednorazowy błąd serwera nie zostaje w pamięci na stałe.
async function zewnetrzne(e) {
  var c = await caches.open(C_ZEWN);
  var z = await c.match(e.request.url);
  var siec = fetch(e.request).then(async function (r) {
    if (r && (r.ok || r.type === "opaque")) await c.put(e.request.url, r.clone());
    return r;
  });
  if (z) { e.waitUntil(siec.catch(function () {})); return z; }
  return siec;
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
