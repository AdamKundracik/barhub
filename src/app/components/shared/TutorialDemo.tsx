import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TutorialWizard } from './TutorialWizard';
import { useTutorial } from '../../utils/hooks/useTutorial';
import { primaryColor } from '../../utils/styles/colors';

export const TutorialDemo: React.FC = () => {
  const {
    showTutorial,
    tutorialViewed,
    loading,
    markTutorialAsViewed,
    skipTutorial,
    showTutorialAgain,
  } = useTutorial();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tutorial Demo</Text>
      <Text style={styles.status}>
        Tutorial Viewed: {tutorialViewed ? 'Yes' : 'No'}
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={showTutorialAgain}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Show Tutorial Again</Text>
      </TouchableOpacity>

      <TutorialWizard
        visible={showTutorial}
        onComplete={markTutorialAsViewed}
        onSkip={skipTutorial}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 30,
  },
  button: {
    backgroundColor: primaryColor,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

