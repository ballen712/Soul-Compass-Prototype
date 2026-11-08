import type { Ref } from 'react';
import { Platform, ScrollView } from 'react-native';
import type { ScrollViewInstance, ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import type {
  KeyboardAwareScrollViewProps,
  KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

type Props = KeyboardAwareScrollViewProps & ScrollViewProps & {
  scrollRef?: Ref<KeyboardAwareScrollViewRef>;
};

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  scrollRef,
  ...props
}: Props) {
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        ref={scrollRef as unknown as Ref<ScrollViewInstance>}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
