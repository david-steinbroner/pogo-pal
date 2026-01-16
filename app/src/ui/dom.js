/**
 * PoGO Pal - DOM Element References
 * Centralized DOM element queries
 */

// Collection filter elements
export const activeIconsEl = document.getElementById('activeIcons');
export const activeAllEl = document.getElementById('activeAll');
export const clearBtn = document.getElementById('clearBtn');
export const typesOpenBtn = document.getElementById('typesOpenBtn');
export const sheet = document.getElementById('typesSheet');
export const backdrop = document.getElementById('sheetBackdrop');
export const gridEl = document.getElementById('typeGrid');
export const doneBtn = document.getElementById('sheetDoneBtn');
export const sheetClearBtn = document.getElementById('sheetClearBtn');
export const selectAllBtn = document.getElementById('selectAllBtn');

// Mode tab elements
export const modeCollectionBtn = document.getElementById('modeCollectionBtn');
export const modeVsBtn = document.getElementById('modeVsBtn');
export const modeTradeBtn = document.getElementById('modeTradeBtn');

// Upload elements
export const uploadBtn = document.getElementById('uploadBtn');
export const fileInput = document.getElementById('fileInput');

// Collection view elements
export const collectionBar = document.getElementById('collectionBar');
export const filterZone = document.getElementById('filterZone');
export const collectionView = document.getElementById('viewCollection');
export const collectionCountEl = document.getElementById('collectionCount');
export const collectionCoverageEl = document.getElementById('collectionCoverage');
export const showingTypesEl = document.getElementById('showingTypes');
export const showingCountEl = document.getElementById('showingCount');
export const parseErrorEl = document.getElementById('parseError');

// View wrapper elements (for mode switching)
export const viewVersus = document.getElementById('viewVersus');
export const viewTrade = document.getElementById('viewTrade');

// VS view elements
export const vsView = document.getElementById('vsView');
export const vsGridEl = document.getElementById('vsTypeGrid');
export const vsSelectedEl = document.getElementById('vsSelected');
export const vsSelectedNoteEl = document.getElementById('vsSelectedNote');
export const vsCountNoteEl = document.getElementById('vsCountNote');
export const vsClearBtn = document.getElementById('vsClearBtn');

// Recommendations container (hidden until types selected)
export const vsRecommendationsEl = document.getElementById('vsRecommendations');

// Section 1: Type Effectiveness
export const vsBringMovesEl = document.getElementById('vsBringMoves');
export const vsAvoidMovesEl = document.getElementById('vsAvoidMoves');
export const vsBringBodiesEl = document.getElementById('vsBringBodies');
export const vsAvoidBodiesEl = document.getElementById('vsAvoidBodies');

// Section 2: Pokemon Recommendations
export const vsPokeRecoResultsEl = document.getElementById('vsPokeRecoResults');
export const vsUploadPromptEl = document.getElementById('vsUploadPrompt');
export const vsTopPicksEl = document.getElementById('vsTopPicks');
export const vsRiskyPicksEl = document.getElementById('vsRiskyPicks');
export const vsRosterNoteEl = document.getElementById('vsRosterNote');
export const vsUploadPromptBtn = document.getElementById('vsUploadPromptBtn');

export const vsRecoHeaderEl = document.getElementById('vsRecoHeader');
export const vsInfoBtn = document.getElementById('vsInfoBtn');
export const vsModal = document.getElementById('vsModal');
export const vsModalBackdrop = document.getElementById('vsModalBackdrop');
export const vsModalClose = document.getElementById('vsModalClose');
export const vsSubEl = document.getElementById('vsSub');

// Trade view elements
export const tradeView = document.getElementById('tradeView');

// Table elements
export const tableBody = document.getElementById('resultsBody');
export const tableHeaders = Array.from(document.querySelectorAll('th.sortable'));

// Info drawer elements
export const infoBtn = document.getElementById('infoBtn');
export const infoDrawer = document.getElementById('infoDrawer');
export const drawerBackdrop = document.getElementById('drawerBackdrop');
export const drawerCloseBtn = document.getElementById('drawerCloseBtn');

// Debug panel elements
export const csvDebugEl = document.getElementById('csvDebug');
export const csvDebugSummaryEl = document.getElementById('csvDebugSummary');
export const csvHeadersEl = document.getElementById('csvHeaders');
export const csvMappingEl = document.getElementById('csvMapping');
export const csvSampleEl = document.getElementById('csvSample');
