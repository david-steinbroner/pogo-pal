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

// Error modal elements (reusable app-wide)
export const errorModal = document.getElementById('errorModal');
export const errorModalBackdrop = document.getElementById('errorModalBackdrop');
export const errorModalClose = document.getElementById('errorModalClose');
export const errorTitle = document.getElementById('errorTitle');
export const errorBody = document.getElementById('errorBody');

// View wrapper elements (for mode switching)
export const viewVersus = document.getElementById('viewVersus');
export const viewTrade = document.getElementById('viewTrade');

// VS view elements
export const vsView = document.getElementById('vsView');
export const vsGridEl = document.getElementById('vsTypeGrid');
export const vsClearBtn = document.getElementById('vsClearBtn');

// Recommendations container (hidden until types selected)
export const vsRecommendationsEl = document.getElementById('vsRecommendations');

// Section 1: Your Pokemon (shown first when CSV uploaded)
export const vsYourPokeSectionEl = document.getElementById('vsYourPokeSection');
export const vsPokeRecoResultsEl = document.getElementById('vsPokeRecoResults');
export const vsUploadPromptEl = document.getElementById('vsUploadPrompt');
export const vsTopPicksEl = document.getElementById('vsTopPicks');
export const vsRiskyPicksEl = document.getElementById('vsRiskyPicks');
export const vsRosterNoteEl = document.getElementById('vsRosterNote');
export const vsUploadPromptBtn = document.getElementById('vsUploadPromptBtn');

// Section 2: General Pokemon - Are Weak Against (always visible when types selected)
export const vsGeneralPokeSectionEl = document.getElementById('vsGeneralPokeSection');
export const vsBudgetSectionEl = document.getElementById('vsBudgetSection');
export const vsBudgetPicksEl = document.getElementById('vsBudgetPicks');

// Section 2b: Are Strong Against
export const vsStrongAgainstSectionEl = document.getElementById('vsStrongAgainstSection');
export const vsStrongAgainstContainerEl = document.getElementById('vsStrongAgainstContainer');
export const vsStrongAgainstPicksEl = document.getElementById('vsStrongAgainstPicks');

// Section 3: Pokemon Types - Are Weak Against (collapsed by default)
export const vsPokeTypesSectionEl = document.getElementById('vsPokeTypesSection');
export const vsBringBodiesEl = document.getElementById('vsBringBodies');

// Section 3b: Pokemon Types - Are Strong Against
export const vsPokeTypesStrongSectionEl = document.getElementById('vsPokeTypesStrongSection');
export const vsAvoidBodiesEl = document.getElementById('vsAvoidBodies');

// Section 5: Move Types - Are Weak Against (collapsed by default)
export const vsMoveTypesSectionEl = document.getElementById('vsMoveTypesSection');
export const vsBringMovesEl = document.getElementById('vsBringMoves');

// Section 5b: Move Types - Are Strong Against
export const vsMoveTypesStrongSectionEl = document.getElementById('vsMoveTypesStrongSection');
export const vsAvoidMovesEl = document.getElementById('vsAvoidMoves');

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

// Upload drawer elements
export const uploadDrawer = document.getElementById('uploadDrawer');
export const uploadDrawerCloseBtn = document.getElementById('uploadDrawerCloseBtn');
export const uploadDrawerBtn = document.getElementById('uploadDrawerBtn');
export const uploadStatus = document.getElementById('uploadStatus');

// Debug panel elements
export const csvDebugEl = document.getElementById('csvDebug');
export const csvDebugSummaryEl = document.getElementById('csvDebugSummary');
export const csvHeadersEl = document.getElementById('csvHeaders');
export const csvMappingEl = document.getElementById('csvMapping');
export const csvSampleEl = document.getElementById('csvSample');
