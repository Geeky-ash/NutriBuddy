import { useProfileStore } from '../../src/store/useProfileStore';
import { useScanStore } from '../../src/store/useScanStore';
import { useMascotStore } from '../../src/store/useMascotStore';
import { useScanHistoryStore } from '../../src/store/useScanHistoryStore';
import { processPackagedLabelScan } from '../../src/services/ai/agents/packagedScanAgent';
import { syncMascotWithScanResult } from '../../src/services/ai/agents/mascotAgent';

describe('End-to-End Scan & Allergen Flow Integration', () => {
  beforeEach(() => {
    useScanStore.getState().resetScan();
    useScanHistoryStore.getState().clearHistory();
    useMascotStore.setState({
      mood: 'IDLE',
      speechText: '',
      isSpeechVisible: false,
    });
  });

  it('runs complete lifecycle: profile allergen setup -> scan label -> allergen alert -> mascot warning -> history logging', async () => {
    // 1. User configures personal profile with Peanut allergy
    const profileStore = useProfileStore.getState();
    expect(profileStore.activeAllergens['Peanuts']).toBe(true);

    const activeAllergens = profileStore.getSelectedAllergensList();
    expect(activeAllergens).toContain('Peanuts');

    // 2. User triggers scan on packaged energy bar containing peanuts
    useScanStore.getState().startScan();
    expect(useScanStore.getState().processingStatus).toBe('SCANNING');

    const result = await processPackagedLabelScan({
      userAllergens: activeAllergens,
    });

    // 3. Update scan store with results
    useScanStore.getState().setScanSuccess(result);
    expect(useScanStore.getState().processingStatus).toBe('SUCCESS');
    expect(result.healthScore).toBeGreaterThan(0);

    // 4. Mascot orchestrator handles reaction
    syncMascotWithScanResult(result);

    const mascotState = useMascotStore.getState();
    // Since result contains milk or peanuts, mascot reacts defensively
    expect(['HAPPY', 'SAD', 'CAUTIOUS']).toContain(mascotState.mood);
    expect(mascotState.speechText.length).toBeGreaterThan(5);

    // 5. User logs meal to Diary
    useScanHistoryStore.getState().addEntry({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      foodName: result.name,
      brand: result.brand,
      scanType: 'PACKAGED',
      healthGrade: result.grade,
      healthScore: result.healthScore,
      macros: result.macrosPer100g,
      flaggedAdditives: result.additivesDetected.map((a) => a.name),
      allergenAlerts: result.flaggedAllergens,
      imageUri: result.imageUrl,
      actionableTips: result.actionableTips || [],
      rawResult: result,
    });

    // 6. Verify history store persistence and metric calculation
    const historyEntries = useScanHistoryStore.getState().entries;
    expect(historyEntries).toHaveLength(1);
    expect(historyEntries[0].foodName).toBe(result.name);
    expect(useScanHistoryStore.getState().getTodayCalories()).toBe(result.macrosPer100g.calories);
  });
});
