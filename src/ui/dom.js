/**
 * PoGO Pal - DOM Element References
 * Centralized DOM element queries
 */

// Type sheet elements
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

// VS sub-tab elements
export const vsSubTabTypes = document.getElementById('vsSubTabTypes');
export const vsSubTabPokemon = document.getElementById('vsSubTabPokemon');
export const vsSubViewTypes = document.getElementById('vsSubViewTypes');
export const vsSubViewPokemon = document.getElementById('vsSubViewPokemon');

// Upload elements
export const uploadBtn = document.getElementById('uploadBtn');
export const fileInput = document.getElementById('fileInput');

// Dark mode toggle
export const darkModeBtn = document.getElementById('darkModeBtn');

// View elements
export const collectionView = document.getElementById('viewCollection');
export const viewVersus = document.getElementById('viewVersus');
export const viewTrade = document.getElementById('viewTrade');

// Error modal elements
export const errorModal = document.getElementById('errorModal');
export const errorModalBackdrop = document.getElementById('errorModalBackdrop');
export const errorModalClose = document.getElementById('errorModalClose');
export const errorTitle = document.getElementById('errorTitle');
export const errorBody = document.getElementById('errorBody');

// VS view elements
export const vsGridEl = document.getElementById('vsTypeGrid');
export const vsClearBtn = document.getElementById('vsClearBtn');
export const vsRecommendationsEl = document.getElementById('vsRecommendations');

// VS sections
export const vsBudgetSectionEl = document.getElementById('vsBudgetSection');
export const vsBudgetPicksEl = document.getElementById('vsBudgetPicks');
export const vsStrongAgainstContainerEl = document.getElementById('vsStrongAgainstContainer');
export const vsStrongAgainstPicksEl = document.getElementById('vsStrongAgainstPicks');
export const vsBringBodiesEl = document.getElementById('vsBringBodies');
export const vsAvoidBodiesEl = document.getElementById('vsAvoidBodies');
export const vsBringMovesEl = document.getElementById('vsBringMoves');
export const vsAvoidMovesEl = document.getElementById('vsAvoidMoves');

// Info drawer elements
export const infoBtn = document.getElementById('infoBtn');
export const infoDrawer = document.getElementById('infoDrawer');
export const drawerBackdrop = document.getElementById('drawerBackdrop');
export const drawerCloseBtn = document.getElementById('drawerCloseBtn');
export const versionCopyBtn = document.getElementById('versionCopyBtn');
export const versionTag = document.getElementById('versionTag');
export const versionCopied = document.getElementById('versionCopied');

// Upload drawer elements
export const uploadDrawer = document.getElementById('uploadDrawer');
export const uploadDrawerCloseBtn = document.getElementById('uploadDrawerCloseBtn');
export const uploadDrawerBtn = document.getElementById('uploadDrawerBtn');
export const uploadStatus = document.getElementById('uploadStatus');

// Pokemon info popup
export const pokePopup = document.getElementById('pokePopup');
export const pokePopupText = document.getElementById('pokePopupText');

// Mini type label popup
export const typeLabelPopup = document.getElementById('typeLabelPopup');
export const typeLabelPopupText = document.getElementById('typeLabelPopupText');

// Table elements (for Collection tab - currently placeholder)
// Always array to prevent undefined.forEach() crashes
export const tableHeaders = [...document.querySelectorAll('th.sortable')];
