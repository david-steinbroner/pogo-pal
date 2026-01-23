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

// VS Pokemon tab elements
export const vsPokemonSelect = document.getElementById('vsPokemonSelect');
export const vsPokemonClearBtn = document.getElementById('vsPokemonClearBtn');
export const vsPokemonDoneBtn = document.getElementById('vsPokemonDoneBtn');
export const vsPokemonHeaderPills = document.getElementById('vsPokemonHeaderPills');
export const vsPokemonSelectorBody = document.getElementById('vsPokemonSelectorBody');
export const vsPokemonRecommendationsEl = document.getElementById('vsPokemonRecommendations');
export const pokemonCarouselTrack = document.getElementById('pokemonCarouselTrack');
export const pokemonCarouselDots = document.getElementById('pokemonCarouselDots');

// VS Pokemon result sections
export const vsPokemonBudgetPicksEl = document.getElementById('vsPokemonBudgetPicks');
export const vsPokemonWorstPicksEl = document.getElementById('vsPokemonWorstPicks');
export const vsPokemonBringBodiesEl = document.getElementById('vsPokemonBringBodies');
export const vsPokemonAvoidBodiesEl = document.getElementById('vsPokemonAvoidBodies');
export const vsPokemonBringMovesEl = document.getElementById('vsPokemonBringMoves');
export const vsPokemonAvoidMovesEl = document.getElementById('vsPokemonAvoidMoves');

// Info drawer elements
export const infoBtn = document.getElementById('infoBtn');
export const infoDrawer = document.getElementById('infoDrawer');
export const drawerBackdrop = document.getElementById('drawerBackdrop');
export const drawerCloseBtn = document.getElementById('drawerCloseBtn');
export const versionCopyBtn = document.getElementById('versionCopyBtn');
export const versionTag = document.getElementById('versionTag');
export const versionCopied = document.getElementById('versionCopied');

// Feedback form elements
export const feedbackSection = document.getElementById('feedbackSection');
export const feedbackRating = document.getElementById('feedbackRating');
export const feedbackIssues = document.getElementById('feedbackIssues');
export const feedbackOtherIssue = document.getElementById('feedbackOtherIssue');
export const feedbackWhere = document.getElementById('feedbackWhere');
export const feedbackText = document.getElementById('feedbackText');
export const feedbackAttachment = document.getElementById('feedbackAttachment');
export const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
export const feedbackStatus = document.getElementById('feedbackStatus');

// Owner controls
export const ownerControls = document.getElementById('ownerControls');
export const feedbackCount = document.getElementById('feedbackCount');
export const exportFeedbackBtn = document.getElementById('exportFeedbackBtn');
export const clearFeedbackBtn = document.getElementById('clearFeedbackBtn');

// Passcode modal
export const passcodeModal = document.getElementById('passcodeModal');
export const passcodeModalBackdrop = document.getElementById('passcodeModalBackdrop');
export const passcodeModalClose = document.getElementById('passcodeModalClose');
export const passcodeInput = document.getElementById('passcodeInput');
export const passcodeSubmitBtn = document.getElementById('passcodeSubmitBtn');
export const passcodeError = document.getElementById('passcodeError');

// Upload drawer elements
export const uploadDrawer = document.getElementById('uploadDrawer');
export const uploadDrawerCloseBtn = document.getElementById('uploadDrawerCloseBtn');
export const uploadDrawerBtn = document.getElementById('uploadDrawerBtn');
export const uploadStatus = document.getElementById('uploadStatus');

// Pokemon info popup
export const pokePopup = document.getElementById('pokePopup');
export const pokePopupText = document.getElementById('pokePopupText');

// Table elements (for Collection tab - currently placeholder)
// Always array to prevent undefined.forEach() crashes
export const tableHeaders = [...document.querySelectorAll('th.sortable')];
