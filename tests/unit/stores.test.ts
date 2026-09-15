import { useScanStore } from '../../src/store/useScanStore';
import { useMascotStore } from '../../src/store/useMascotStore';

describe('useScanStore', () => {
  beforeEach(() => {
    useScanStore.getState().resetScan();
  });

  it('initializes with IDLE status and PACKAGED scan type', () => {
    const state = useScanStore.getState();
    expect(state.processingStatus).toBe('IDLE');
    expect(state.scanType).toBe('PACKAGED');
    expect(state.scanResults).toBeNull();
  });

  it('updates scan type correctly', () => {
    useScanStore.getState().setScanType('LIVE_FOOD');
    expect(useScanStore.getState().scanType).toBe('LIVE_FOOD');
  });

  it('starts scan and sets SCANNING status', () => {
    useScanStore.getState().startScan('file://image.jpg');
    const state = useScanStore.getState();
    expect(state.processingStatus).toBe('SCANNING');
    expect(state.activeImageUri).toBe('file://image.jpg');
  });
});

describe('useMascotStore', () => {
  it('triggers HAPPY mood for high score >= 75', () => {
    useMascotStore.getState().triggerReactivityForScore(92);
    const state = useMascotStore.getState();
    expect(state.mood).toBe('HAPPY');
    expect(state.speechText).toContain('92/100');
  });

  it('triggers CAUTIOUS mood for moderate score 50-74', () => {
    useMascotStore.getState().triggerReactivityForScore(65);
    const state = useMascotStore.getState();
    expect(state.mood).toBe('CAUTIOUS');
  });

  it('triggers SAD / Alarmed mood if allergens are detected', () => {
    useMascotStore.getState().triggerReactivityForScore(95, ['Peanuts']);
    const state = useMascotStore.getState();
    expect(state.mood).toBe('SAD');
    expect(state.speechText).toContain('Peanuts');
  });
});
