import { forwardRef, useRef, useState } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

// Keep the native ref API available to callers that focus or reveal form fields.
export type StableScrollViewHandle = ScrollView;

/** Keep a tapped control in place when filtering or collapsing shortens a page. */
export const StableScrollView = forwardRef<ScrollView, ScrollViewProps>(function StableScrollView(
  {
    contentContainerStyle,
    onLayout,
    onScroll,
    onTouchStart,
    scrollEventThrottle,
    horizontal,
    ...props
  },
  ref,
) {
  const offset = useRef(0);
  const viewport = useRef(0);
  const [minimumHeight, setMinimumHeight] = useState(0);

  // Horizontal galleries and option lists retain their normal sizing behavior.
  if (horizontal)
    return (
      <ScrollView
        {...props}
        ref={ref}
        horizontal
        contentContainerStyle={contentContainerStyle}
        onLayout={onLayout}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        scrollEventThrottle={scrollEventThrottle}
      />
    );

  return (
    <ScrollView
      {...props}
      ref={ref}
      contentContainerStyle={[contentContainerStyle, { minHeight: minimumHeight }]}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      onLayout={(event) => {
        viewport.current = event.nativeEvent.layout.height;
        onLayout?.(event);
      }}
      onScroll={(event) => {
        offset.current = event.nativeEvent.contentOffset.y;
        onScroll?.(event);
      }}
      onScrollEndDrag={(event) => {
        offset.current = event.nativeEvent.contentOffset.y;
        setMinimumHeight(Math.ceil(viewport.current + Math.max(0, offset.current)));
        props.onScrollEndDrag?.(event);
      }}
      onMomentumScrollEnd={(event) => {
        offset.current = event.nativeEvent.contentOffset.y;
        setMinimumHeight(Math.ceil(viewport.current + Math.max(0, offset.current)));
        props.onMomentumScrollEnd?.(event);
      }}
      onTouchStart={(event) => {
        // Reserve enough content before the child's onPress can remove rows. This
        // prevents native offset clamping; it never calls scrollTo on the user's behalf.
        setMinimumHeight(Math.ceil(viewport.current + Math.max(0, offset.current)));
        onTouchStart?.(event);
      }}
    />
  );
});
