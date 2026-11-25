// INACTIVE VIEW: a layered view (in a full-screen Stack) that is not the active one takes no touches and is hidden
// from screen readers, while it can still paint its exit animation.
// WHEN: every app that stacks several full-screen views/layers (shelf, catalogue, list, overlays) instead of routes.
// DEVICE LESSONS (Softbound):
//  - After leaving the catalogue no touch worked anywhere: its full-screen Listener stayed alive above the other layers
//    and swallowed every tap. Inactive views must IgnorePointer (regression test: touch_after_catalogue_test.dart).
//  - Hidden chrome still read out by TalkBack while a note was open → ExcludeSemantics.
//  - Once its exit animation is over, also stop its tickers/timers (or don't build it at all); IgnorePointer alone
//    doesn't stop painting.
import 'package:flutter/widgets.dart';

class InactiveView extends StatelessWidget {
  const InactiveView({super.key, required this.active, required this.child});
  final bool active;
  final Widget child;

  @override
  Widget build(BuildContext context) =>
      IgnorePointer(ignoring: !active, child: ExcludeSemantics(excluding: !active, child: child));
}
