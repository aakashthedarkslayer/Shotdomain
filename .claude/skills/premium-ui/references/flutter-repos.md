# Flutter repos to study (pattern -> exact file)

Read when a build needs a signature pattern (parallax, bespoke transition, shader, particles, physics, state-machine art) and you would otherwise invent it from scratch.
Clone on demand with `git clone --depth 1 <url>` into the project's git-ignored `references/` only while building that pattern; never vendor files into the kit or the app. Study, then write our own.
Licences: all MIT/BSD-3 except where flagged in the repo list (shader galleries have NO licence file; Shadertoy originals carry their authors' licences). Every path checked by script against the repo trees on 2026-11-10. A bare filename sits beside the path before it.

## Pattern map

| Pattern | Repo | File(s) to study | What to take from it |
|-|-|-|-|
| **Transitions / continuity** | | | |
| Hero with rich state kept across pages | vignettes | `vignettes/parallax_travel_cards_hero/lib/city_details_page.dart`, `city_scenery.dart` | Custom hero flight that keeps animation state between routes |
| Hero flight with image sequence + overlay | vignettes | `vignettes/product_detail_zoom/lib/product_details_hero_flight.dart`, `product_details_transition.dart` | Choreographed hero, sprite sequence inside the flight |
| Theme-switch reveal via mask | vignettes | `vignettes/dark_ink_transition/lib/transition_container.dart`, `dark_ink_content.dart`; `vignettes/_shared/lib/ui/widget_mask.dart` | Mask arbitrary widget with a frame sequence for a page-wide reveal |
| Gooey edge page swipe | vignettes | `vignettes/gooey_edge/lib/gooey_edge.dart`, `gooey_edge_painter.dart`, `gooey_edge_clipper.dart` | Path-as-mask edge, tension simulation between points |
| Hero on illustration / title | wonderous | `lib/ui/wonder_illustrations/common/wonder_hero.dart`, `wonder_title_text.dart` | Hero wrappers around layered art |
| Route helper (fade dialogs, pop on overscroll) | wonderous | `lib/ui/common/utils/page_routes.dart`, `lib/ui/common/pop_router_on_over_scroll.dart` | Small route factory; drag-past-edge to pop |
| **Illustration + parallax** | | | |
| Layered illustration, per-piece offsets | wonderous | `lib/ui/wonder_illustrations/common/illustration_piece.dart`, `wonder_illustration.dart`, `wonder_illustration_config.dart`, `wonder_illustration_builder.dart`, `lib/ui/wonder_illustrations/pyramids_giza_illustration.dart` | Stack of fractional-offset pieces; one config drives every wonder |
| Drifting clouds / ambient loop | wonderous | `lib/ui/wonder_illustrations/common/animated_clouds.dart`, `paint_textures.dart` | Cheap ambient motion, texture overlay |
| Parallax list cards with 3D tilt | vignettes | `vignettes/parallax_travel_cards_list/lib/travel_card_renderer.dart`, `travel_card_list.dart` | Stack parallax inside list item plus Transform tilt |
| Home swipe parallax | wonderous | `lib/ui/screens/home/wonders_home_screen.dart`, `lib/ui/screens/home/_vertical_swipe_controller.dart` | Layered parallax across pager + vertical swipe |
| Flame parallax layers | flame | `examples/lib/stories/parallax/advanced_parallax_example.dart`, `animation_parallax_example.dart` | Multi-layer parallax with per-layer velocity |
| **Scroll choreography** | | | |
| Collapsing image + pull quote | wonderous | `lib/ui/screens/editorial/widgets/_collapsing_pull_quote_image.dart`, `_sliding_image_stack.dart`, `_top_illustration.dart`, `_scrolling_content.dart`, `lib/ui/screens/editorial/editorial_screen.dart` | Scroll offset drives image collapse, slide, illustration fade |
| Scaling list items | wonderous | `lib/ui/common/scaling_list_item.dart` (`ScalingListItem`, `AnimatedListItem`) | Scale/fade by distance from viewport centre |
| Stacked page view | wonderous | `lib/ui/common/stacked_page_view_builder.dart` | Pages that stack/peel instead of slide |
| Collapsing carousel | wonderous | `lib/ui/screens/artifact/artifact_carousel/widgets/_collapsing_carousel_item.dart`, `lib/ui/screens/artifact/artifact_carousel/artifact_carousel_screen.dart` | Carousel items collapse by scroll position |
| Pannable timeline viewport | wonderous | `lib/ui/screens/timeline/widgets/_scrolling_viewport.dart`, `_scrolling_viewport_controller.dart`, `_bottom_scrubber.dart`, `_event_markers.dart` | 2D scroll with scale, scrubber, markers |
| Scroll-driven effect on any widget | flutter_animate | `lib/src/adapters/scroll_adapter.dart` (`ScrollAdapter`), `example/lib/examples/adapter_view.dart` | Bind an effect chain to scroll offset, no controller wiring |
| Pull to refresh with sprite | vignettes | `vignettes/basketball_ptr/lib/pull_to_refresh_container.dart`, `spinning_basketball.dart` | Custom overscroll indicator |
| Scroll-speed-aware canvas bg | vignettes | `vignettes/constellations_list/lib/star_field/star_field_painter.dart`, `vignettes/constellations_list/lib/constellation_list_renderer.dart` | Painter speed follows scroll and page transitions |
| **Custom painters / data art** | | | |
| Charts + panning on Canvas | vignettes | `vignettes/spending_tracker/lib/spending_graph.dart`, `chart/` | Hand-painted graphs with gestures |
| Liquid fill card | vignettes | `vignettes/drink_rewards_list/lib/liquid_painter.dart`, `drink_card.dart` | Wave path simulating liquid |
| Fluid nav bar + path icons | vignettes | `vignettes/fluid_nav_bar/lib/fluid_nav_bar.dart`, `curves.dart`, `fluid_icon.dart` | Bouncy curve painting, animated Path icons |
| Time-range painter | wonderous | `lib/ui/screens/artifact/artifact_search/time_range_selector/time_range_painter.dart`, `range_selector.dart` | Custom range slider painting |
| Blend-mode render object | wonderous | `lib/ui/common/blend_mask.dart` (`RenderBlendMask`) | Blend a child with a custom RenderProxyBox |
| Folding card (3D transform) | vignettes | `vignettes/ticket_fold/lib/folding_ticket.dart` | Multi-fold Transform card |
| **Shaders** | | | |
| FragmentProgram widget workflow | flutter_shaders | `packages/flutter_shaders/lib/src/shader_builder.dart` (`ShaderBuilder`), `lib/src/set_uniforms.dart` (`SetUniforms`, `UniformsSetter`), `example/lib/main.dart`, `example/shaders/*.frag` | Load, cache, set uniforms, drive with a ticker |
| Shade a widget's pixels (capture child as sampler) | flutter_shaders | `lib/src/animated_sampler.dart` (`AnimatedSampler`), `example/lib/sampler_example.dart`, `lib/shaders/pixelation.frag` | Child -> texture -> shader without per-frame image round-trips |
| Shader ink splash | flutter_shaders | `lib/src/inkwell_shader.dart`, `example/shaders/inkwell.frag` | Shader-backed tap ripple |
| Shader on text / widgets in a real app | flutter/demos | `varfont_shader_puzzle/lib/components/fragment_shaded.dart`, `shaders/wavy.frag`, `wavy_circ.frag`, `pubspec.yaml` (`shaders:` block) | Production-style program cache + sampler builder |
| Shader as an animation effect | flutter_animate | `lib/src/effects/shader_effect.dart` (`ShaderEffect`), `shimmer_effect.dart` | Apply FragmentShader in a chain with `updateUniforms` |
| Shadertoy-style effect library (100+ `.frag`) | awesome_flutter_shaders | `shaders/` (e.g. `shaders/r/Raymarching Basic.frag`), `lib/`, `README.md` | Ported effects to read and adapt; see licence caveat |
| **Physics / particles** | | | |
| Fast particle field (drawVertices) | vignettes | `vignettes/sparkle_party/lib/particlefx/particle_fx_painter.dart`, `fireworks.dart`, `comet.dart` | Thousands of sprites in one draw call |
| Swipe-to-dust particles | vignettes | `vignettes/particle_swipe/lib/particle_field_painter.dart`, `particle.dart`, `swipe_item.dart` | Particles tied to list swipe |
| Spring / constrained scroll physics | vignettes | `vignettes/_shared/lib/physics/constrained_scroll_physics.dart` | Custom ScrollPhysics |
| Rigid bodies (forge2d) | flame | `examples/lib/stories/bridge_libraries/flame_forge2d/domino_example.dart`, `drag_callbacks_example.dart`, `widget_example.dart`; `packages/flame_forge2d/lib/body_component.dart` | Bodies, joints, drag, embedding in a Flutter widget |
| Flame particles | flame | `examples/lib/stories/rendering/particles_example.dart`, `particles_interactive_example.dart`; `doc/flame/rendering/particles.md` | Composable particle system |
| Celebration burst | wonderous | `lib/ui/screens/collectible_found/widgets/_celebration_particles.dart`, `_animated_ribbon.dart` | Reward moment |
| **Interactive illustration** | | | |
| State machine driven by app state | rive-flutter | `example/lib/examples/inputs.dart`, `state_machine_painter.dart`, `databinding.dart`, `events.dart`; `lib/src/widgets/rive_widget.dart` (`RiveWidget`), `lib/src/painters/widget_controller.dart` (`RiveWidgetController`) | Drive inputs/view-model from state, listen to events |
| Rive + game loop | rive-flutter | `example/lib/advanced/centaur_example/centaur_game.dart` | Embedding Rive in a game-like scene |
| Character on canvas slider | vignettes | `vignettes/dog_slider/lib/dog_slider.dart`, `moving_character_physics_2d.dart` | Character reacts to a custom control (Flare is dead, port to Rive) |
| 3D model background + mask | vignettes | `vignettes/indie_3d/lib/indie_3d_model.dart`, `indie_3d_model_controller.dart`; `vignettes/_shared/lib/ui/blend_mask.dart` | Custom 3D render with blend masking |
| Gesture-direction navigation | wonderous | `lib/ui/common/controls/eight_way_swipe_detector.dart` | 8-way swipe detector |
| **Micro-interactions** | | | |
| Chained effects, shake, flip, follow path | flutter_animate | `lib/src/animate.dart` (`Animate`), `effects/shake_effect.dart`, `flip_effect.dart`, `follow_path_effect.dart`, `then_effect.dart`, `example/lib/examples/everything_view.dart` | `.animate().fade().then().move()` chaining, delays, reuse |
| Toggle/value-driven effects | flutter_animate | `lib/src/adapters/value_adapter.dart`, `change_notifier_adapter.dart`, `lib/src/effects/toggle_effect.dart` | Drive effects from state instead of time |
| Bespoke nav bars | vignettes | `vignettes/bubble_tab_bar/lib/navbar_button.dart`, `clipped_view.dart` | Shape/size-morphing buttons |
| Multi-step form feel | vignettes | `vignettes/plant_forms/lib/form_pages/`, `form_inputs/` | Staged form transitions |
| Pulsing / delayed fade | vignettes | `vignettes/product_detail_zoom/lib/pulsing_button.dart`, `components/delayed_fade_in.dart` | Tiny reusable attention cues |

## Vignettes index (name -> shows -> main file)

All under `vignettes/<folder>/lib/` in gskinnerTeam/flutter_vignettes.

| Folder | Name | Shows | Main file |
|-|-|-|-|
| parallax_travel_cards_list | Travel Cards | Parallax in list + 3D tilt | `travel_card_renderer.dart` |
| parallax_travel_cards_hero | Paris Hero Transition | Custom hero that keeps state | `city_details_page.dart` |
| gooey_edge | Gooey Transition | Curved path mask, tension physics | `gooey_edge.dart` |
| ticket_fold | Boarding Pass | Folding Transform card | `folding_ticket.dart` |
| particle_swipe | Inbox Swipe Particles | Particles on swipe | `particle_field_painter.dart` |
| bubble_tab_bar | Icon Flip Bar | Morphing nav buttons | `navbar.dart` |
| drink_rewards_list | Liquid Rewards | Liquid via Canvas + resizable cards | `liquid_painter.dart` |
| dog_slider | Dog Toy Slider | Character-driven custom slider | `dog_slider.dart` |
| constellations_list | Star Particles | Animated canvas bg, scroll-driven | `star_field/star_field_painter.dart` |
| fluid_nav_bar | Fluid Button Bar | Bouncy path-drawn nav | `fluid_nav_bar.dart` |
| product_detail_zoom | Product Zoom | PNG-sequence in Hero, canvas overlay | `product_details_hero_flight.dart` |
| dark_ink_transition | Article Dark Mode | PNG sequence as mask for theme switch | `transition_container.dart` |
| basketball_ptr | Pull To Refresh | Sprite-based refresh | `pull_to_refresh_container.dart` |
| plant_forms | Plant Cart | Multi-part validated forms | `form_pages/` |
| indie_3d | Artist Carousel | Custom 3D render + blend mask | `indie_3d_model.dart` |
| sparkle_party | Sparkle Particles | drawVertices mass particles | `particlefx/particle_fx_painter.dart` |
| spending_tracker | Budget Graphs | Canvas charts, 2D pan | `spending_graph.dart` |

## Repos

| Repo | URL | Licence | Last commit seen | SDK constraint |
|-|-|-|-|-|
| wonderous | https://github.com/gskinnerTeam/flutter-wonderous-app | MIT | 2026-07-30 | Dart `^3.11.5` (current). No fragment shaders in it. |
| flutter_vignettes | https://github.com/gskinnerTeam/flutter_vignettes | MIT | 2024-04-30 | Dart `>=2.12.0` per vignette. Stale: needs porting. |
| flutter_shaders (current home) | https://github.com/flutter/packages/tree/main/packages/flutter_shaders | BSD-3 | 2026-11-10 | v0.1.5, Dart `^3.11.0`, Flutter `>=3.41.0` |
| flutter_shaders (old, author repo) | https://github.com/jonahwilliams/flutter_shaders | BSD-3 | 2024-06-20 | v0.1.3, Dart `>=2.19.0` (superseded) |
| flutter/demos | https://github.com/flutter/demos (`varfont_shader_puzzle/`) | BSD-3 | 2026-11-06 | Dart `^3.7.0-0` |
| awesome_flutter_shaders | https://github.com/nightmare-space/awesome_flutter_shaders | **No LICENSE file** (all rights reserved by default; Shadertoy originals usually CC BY-NC-SA 3.0) | 2026-09-27 | check its `pubspec.yaml`; renders via `shader_graph` + `flutter_shaders ^0.1.2` |
| flutter_animate | https://github.com/gskinner/flutter_animate (pub.dev repo URL; `gskinnerTeam/flutter_animate` 404s) | BSD-3 | 2024-11-25 | v4.5.2, Dart `>=2.17.0 <4.0.0` |
| rive-flutter | https://github.com/rive-app/rive-flutter | MIT (runtime; Rive editor and .riv assets have their own terms) | 2026-11-10 | main is v0.15.0-dev.4, Dart `>=3.8.0 <4.0.0` |
| flame (+ forge2d bridge) | https://github.com/flame-engine/flame | MIT | 2026-11-09 | main is v2.0.0-dev.1, Dart `>=3.13.0 <4.0.0`; `flame_forge2d` 0.21.0-dev.1 depends on `forge2d ^0.15.1` |

UNVERIFIED:
- "Building next generation UIs in Flutter" codelab source: NOT found. `flutter/codelabs` (main) and `flutter/demos` (incl. `_archive/`) contain no `next_gen_ui` folder; no official repo found by name. Only third-party forks surfaced (not used). Do not cite a path. Use `flutter/demos/varfont_shader_puzzle` and `flutter_shaders` for the same FragmentProgram workflow.
- Another gallery seen, not mapped: https://github.com/cscoderr/flutter_awesome_shaders (no LICENSE file either; last commit 2026-01-06).
- No verified "official" awesome_flutter_shaders; the nightmare-space repo is the best match for the name.

## Gotchas (noticed while reading)

- Shader workflow: declare each `.frag` under `flutter: shaders:` in `pubspec.yaml` (see `varfont_shader_puzzle/pubspec.yaml`), load with `FragmentProgram.fromAsset`, cache the program, and call `.fragmentShader()` per use. Uniform order must match the GLSL declaration order.
- Shadertoy ports: Flutter GLSL uses `#include <flutter/runtime_effect.glsl>` and `FlutterFragCoord()`, no `iChannel` buffers or multipass. Multipass shaders in awesome_flutter_shaders (`BufferA` files) go through `shader_graph`, not plain FragmentProgram.
- `flutter_shaders` old copy (jonahwilliams, 0.1.3) pins Flutter `>=3.7`; use the `flutter/packages` version for Flutter 3.38+.
- `Color.withOpacity` is deprecated (use `withValues(alpha:)`): present in 17 lines across wonderous + vignettes.
- vignettes: `dog_slider` uses `flare_flutter 3.0.2` (discontinued; replace with Rive). Some vignettes use pre-Material-3 widgets (`FlatButton`/`RaisedButton`/`accentColor` in 1 file) and `window` access; expect analyzer errors on 3.38, so read for the technique, do not copy.
- rive-flutter main is a rewrite: new API is `RiveWidget` / `RiveWidgetController` / `RiveWidgetBuilder` (`lib/rive.dart`); old `RiveAnimation` + `StateMachineController` is under `lib/legacy.dart`. Tutorials online mostly show the legacy API. Pin the version you actually use on pub.dev.
- flame main is 2.0.0-dev and needs Dart `>=3.13`; pub.dev stable (1.x) APIs differ. Check the pinned version before copying example structure.
- flutter_animate was last updated 2024-11; works, but verify `ShaderEffect` against current `FragmentShader` API when you use it.
- wonderous ships with `get_it` and its own state layer; study the widgets, not the architecture.
