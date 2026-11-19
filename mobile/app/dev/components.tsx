import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useTheme } from '@/theme';
import {
  Screen,
  NavyHeader,
  AppText,
  Button,
  NavigateButton,
  Badge,
  Card,
  ListRow,
  MetaPair,
  StepRow,
  SegmentedControl,
  TextField,
  PhoneField,
  OtpInput,
  NumberField,
  Checkbox,
  EmptyState,
  ContactDispatchButtons,
  useTopAlert,
} from '@/components/ui';

export default function ComponentShowcaseScreen() {
  const router = useRouter();
  const { mode, setMode, isDark, colors, spacing } = useTheme();

  // State for interactive components
  const [phone, setPhone] = useState('(207) 555-0168');
  const [otp, setOtp] = useState('1234');
  const [segmentedIdx, setSegmentedIdx] = useState(0);
  const [textVal, setTextVal] = useState('John Doe');
  const [yardsVal, setYardsVal] = useState('42.5');
  const [hoseVal, setHoseVal] = useState('150');
  const [checkbox1, setCheckbox1] = useState(true);
  const [checkbox2, setCheckbox2] = useState(false);

  const { showAlert } = useTopAlert();
  const triggerToast = (msg: string) =>
    showAlert(msg, { action: { label: 'Undo', onPress: () => showAlert('Action undone') } });

  return (
    <View style={styles.root}>
      <NavyHeader
        backLabel="Home"
        title="Component Showcase"
        onBack={() => router.back()}
      />

      <Screen scroll padded headerBackground="navy">
        {/* Theme Switcher Header */}
        <View style={[styles.section, { marginTop: spacing.base }]}>
          <AppText variant="headline" tone="heading">
            Theme Switcher (Current: {mode.toUpperCase()} / {isDark ? 'Dark' : 'Light'})
          </AppText>
          <View style={styles.themeRow}>
            {(['system', 'light', 'dark'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: mode === m ? colors.primary : colors.surfaceMuted,
                    borderColor: mode === m ? colors.primary : colors.border,
                  },
                ]}
              >
                <AppText
                  variant="button"
                  tone={mode === m ? 'navyForeground' : 'default'}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 1. AppText Typography */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            1. TYPOGRAPHY & TONES
          </AppText>
          <AppText variant="display" tone="heading">
            Display (Welcome back)
          </AppText>
          <AppText variant="title" tone="heading">
            Title (Oak Hill Foundation)
          </AppText>
          <AppText variant="headline" tone="default">
            Headline (24 Oak Hill Road, Litchfield)
          </AppText>
          <AppText variant="value" tone="heading">
            Value Tabular: 10:30 AM · 42.5 yd³
          </AppText>
          <AppText variant="body" tone="default">
            Body regular text for descriptions and notes.
          </AppText>
          <AppText variant="bodyStrong" tone="default">
            Body strong for emphasized rows and labels.
          </AppText>
          <AppText variant="small" tone="muted">
            Small muted helper text or timestamps.
          </AppText>
          <AppText variant="caption" tone="primary">
            Caption: You can do this later
          </AppText>
          <AppText variant="small" tone="link">
            Link tone: Terms & conditions
          </AppText>
          <AppText variant="small" tone="danger">
            Danger tone: That code didn&apos;t work.
          </AppText>
          <AppText variant="small" tone="warning">
            Warning tone: Dispatch updated this job.
          </AppText>
        </View>

        {/* 2. Badges */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            2. BADGES
          </AppText>
          <View style={styles.badgeRow}>
            <Badge label="Acknowledged" tone="primary" />
            <Badge label="In progress" tone="primary" />
            <Badge label="New" tone="neutral" />
            <Badge label="Needs submission" tone="warning" dot />
            <Badge label="Cancelled" tone="danger" />
          </View>
        </View>

        {/* 3. Buttons */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            3. BUTTONS
          </AppText>
          <View style={styles.gap12}>
            <Button
              label="Primary Large (Arrived at shop)"
              size="lg"
              variant="primary"
              onPress={() => triggerToast('Arrived at shop · 8:02 AM')}
            />
            <Button
              label="Primary Medium"
              size="md"
              variant="primary"
              onPress={() => {}}
            />
            <Button
              label="Primary Small"
              size="sm"
              variant="primary"
              onPress={() => {}}
            />
            <Button
              label="Loading Button"
              loading
              variant="primary"
            />
            <Button
              label="Disabled Button"
              disabled
              variant="primary"
            />
            <Button
              label="Outline Secondary"
              variant="outline"
              size="md"
              onPress={() => {}}
            />
            <Button
              label="Link Text Button"
              variant="link"
              onPress={() => triggerToast('Link clicked')}
            />
          </View>
        </View>

        {/* 4. NavigateButton */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            4. NAVIGATE BUTTON
          </AppText>
          <NavigateButton
            label="Navigate to shop"
            subLabel="Midcoast Concrete Pumping · Warren, ME"
            onPress={() => triggerToast('Opening map for Shop...')}
          />
        </View>

        {/* 5. Cards */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            5. CARDS (DEFAULT & SOFT TEAL)
          </AppText>
          <View style={styles.gap12}>
            <Card tone="default">
              <AppText variant="bodyStrong">Standard Card</AppText>
              <AppText variant="small" tone="muted">
                Surface background with 1px border and 16px radius.
              </AppText>
            </Card>

            <Card tone="soft">
              <View style={styles.cardHeader}>
                <AppText variant="headline" tone="heading">
                  Work ticket
                </AppText>
                <Badge label="Needs submission" tone="warning" />
              </View>
              <AppText variant="small" tone="muted" style={{ marginVertical: 8 }}>
                Pour times · Yards pumped · Hose & extras
              </AppText>
              <Button
                label="Complete work ticket"
                size="md"
                variant="primary"
                caption="You can do this later"
                onPress={() => triggerToast('Opening work ticket...')}
              />
            </Card>
          </View>
        </View>

        {/* 6. ListRows */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            6. LIST ROWS
          </AppText>
          <Card tone="default" style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow
              label="Work ticket"
              value="Draft saved"
              onPress={() => triggerToast('Work ticket row')}
            />
            <ListRow
              label="Customer & details"
              onPress={() => triggerToast('Customer & details row')}
            />
            <ListRow
              label="Appearance"
              value={mode.charAt(0).toUpperCase() + mode.slice(1)}
              onPress={() => triggerToast('Appearance row')}
            />
            <ListRow
              label="Sign out"
              destructive
              showChevron={false}
              showDivider={false}
              onPress={() => triggerToast('Sign out requested')}
            />
          </Card>
        </View>

        {/* 7. MetaPair */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            7. META PAIR
          </AppText>
          <MetaPair
            left={{ label: 'Pour starts', value: '10:30 AM' }}
            right={{ label: 'Pump', value: '02 · 28m boom' }}
          />
        </View>

        {/* 8. StepRow */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            8. STEP ROWS
          </AppText>
          <Card tone="default">
            <StepRow
              label="Arrived at shop"
              time="8:02 AM"
              onEdit={() => triggerToast('Edit time: Arrived at shop')}
            />
            <StepRow
              label="Departed shop"
              time="8:41 AM"
              isPendingSync
              onEdit={() => triggerToast('Edit time: Departed shop')}
            />
          </Card>
        </View>

        {/* 9. SegmentedControl */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            9. SEGMENTED CONTROL
          </AppText>
          <SegmentedControl
            options={['Today', 'Upcoming']}
            selectedIndex={segmentedIdx}
            onChange={(idx) => setSegmentedIdx(idx)}
          />
        </View>

        {/* 10. Form Fields (TextField, PhoneField, OtpInput, NumberField, Checkbox) */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            10. FORM INPUTS
          </AppText>
          <PhoneField
            value={phone}
            onChangeText={(fmt) => setPhone(fmt)}
          />
          <TextField
            label="Customer name"
            value={textVal}
            onChangeText={setTextVal}
            helperText="Tap to edit if someone else is signing"
            leftIcon={<Mail size={18} color={colors.mutedForeground} />}
          />
          <NumberField
            label="Yards pumped"
            value={yardsVal}
            onChangeText={setYardsVal}
            suffix="yd³"
            allowDecimals
          />
          <NumberField
            label="3-inch hose"
            value={hoseVal}
            onChangeText={setHoseVal}
            suffix="ft"
          />

          <AppText variant="small" tone="default" style={{ marginBottom: 6, fontWeight: '600' }}>
            Verification Code
          </AppText>
          <OtpInput
            value={otp}
            onChange={setOtp}
            onComplete={(code) => triggerToast(`Code completed: ${code}`)}
          />

          <View style={{ marginTop: 8 }}>
            <Checkbox
              label="Off-site washout"
              checked={checkbox1}
              onToggle={setCheckbox1}
            />
            <Checkbox
              label="Primer bag"
              checked={checkbox2}
              onToggle={setCheckbox2}
            />
          </View>
        </View>

        {/* 11. EmptyState */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            11. EMPTY STATE
          </AppText>
          <Card tone="default">
            <EmptyState
              title="No jobs assigned today"
              subtitle="Check upcoming jobs or contact dispatch if you expected a schedule."
            >
              <Button
                label="View upcoming jobs"
                size="md"
                variant="primary"
                onPress={() => triggerToast('Switching to Upcoming')}
                style={{ marginBottom: 12 }}
              />
              <ContactDispatchButtons dispatchPhone="+12075550168" />
            </EmptyState>
          </Card>
        </View>

        {/* 12. ContactDispatchButtons */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted">
            12. CONTACT DISPATCH BUTTONS
          </AppText>
          <ContactDispatchButtons dispatchPhone="+12075550168" />
        </View>

        {/* Toast Trigger */}
        <View style={[styles.section, { marginBottom: 80 }]}>
          <Button
            label="Test Undo Toast (5s)"
            variant="outline"
            onPress={() => triggerToast('Arrived at shop · 8:02 AM')}
          />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  section: {
    marginVertical: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  themeButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  gap12: {
    gap: 12,
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
