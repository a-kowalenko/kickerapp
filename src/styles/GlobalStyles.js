import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`

/* This styles the scrollbar track */
*::-webkit-scrollbar {
    width: 12px; /* width of the entire scrollbar */
    height: 12px; /* height of the entire scrollbar */
  }

  /* This styles the scrollbar thumb */
  *::-webkit-scrollbar-thumb {
    background: var(--primary-button-color); /* color of the scroll thumb */
    border-radius: 6px; /* roundness of the scroll thumb */
    border: 3px solid var(--secondary-background-color); /* Creates padding around the scroll thumb */
  }

  /* This styles the scrollbar thumb on hover */
  *::-webkit-scrollbar-thumb:hover {
    background: var(--primary-button-color-hover); /* color of the scroll thumb on hover */
  }

  /* This styles the scrollbar track */
  *::-webkit-scrollbar-track {
    background: transparent; /* color of the scrollbar track */
  }

  /* This styles the scrollbar corner */
  *::-webkit-scrollbar-corner {
    background: transparent; /* color of the scrollbar corner */
  }

  /* For Firefox */
  * {
    scrollbar-width: thin; /* "auto" or "thin" */
    scrollbar-color: var(--primary-button-color) var(--secondary-background-color); /* thumb and track color */
  }


:root {

    /* &.dark-mode {

    --color-amber-50: #3b3e45;
    --color-amber-75: #111827;
    --color-amber-100: #111827;
    --color-amber-200: rgb(253 230 138);
    --color-amber-300: rgb(252 211 77);
    


    --color-grey-0: #111827;
  --color-grey-50: #f9fafb;
  --color-grey-100: #f3f4f6;
  --color-grey-200: #e5e7eb;
  --color-grey-300: #d1d5db;
  --color-grey-400: #9ca3af;
  --color-grey-500: #6b7280;
  --color-grey-600: #a1a7b0;
  --color-grey-700: #cbd5e6;
  --color-grey-800: #1f2937;
  --color-grey-900: #111827;

  } */

  

  &.dark-mode {

    // Backgrounds
    --primary-background-color: #0f0f0f;
    --secondary-background-color: #191919;
    --tertiary-background-color: #18212f;

    // Text
    --primary-text-color: #fff;
    --secondary-text-color: #888;
    --tertiary-text-color: #4d98c9;

    --link-text-color: #00a6ff;


    // Border
    --primary-border-color: #525252;
    --secondary-border-color: #0f0f0f;

    // Pulse animation colors
    --pulse-color-transparent: rgba(7, 89, 133, 0);
    --pulse-color-heavily-transparent: rgba(7, 89, 133,  0.3);
    --pulse-color-medium-transparent: rgba(7, 89, 133,  0.4);
    --pulse-color-slightly-transparent: rgba(7, 89, 133, 0.7);

    // Disabled
    --disabled-color: #4b5563;

    // NavBarLinks
    --nav-link-color: var(--color-grey-600);
    --nav-link-color-active: var(--color-grey-800);
    --nav-link-background-color-active: #075985;
    --nav-link-svg-color: var(--color-grey-400);
    --nav-link-svg-color-active: #fff; 

    // Inputs
    --primary-input-border-color: #525252;
    --primary-input-border-color-active: #1c62b9;
    --primary-input-background-color: transparent;
    --primary-input-background-color-hover: transparent;
    
    --error-input-border-color: #ff0000;
    --error-input-background-color: transparent;
    --error-input-background-color-hover: transparent;

    // Buttons
    --primary-button-color: #075985;
    --primary-button-color-hover: #086597;
    --primary-button-color-active: #074e74;
    --primary-button-color-text: #ffffff;

    --secondary-button-color: #d9d9d9;
    --secondary-button-color-active: #bcbcbc;
    --secondary-button-color-text: #000000;

    --danger-button-color: #d61313;
    --danger-button-color-active: #ff4848;
    --danger-button-color-text: #ffffff;

    // Dropdowns
    --primary-dropdown-background-color: transparent;
    --primary-dropdown-background-color-hover: transparent;
    --primary-dropdown-text-color: #ffffff;
    --primary-dropdown-border-color: #525252;
    --dropdown-list-background-color: #191919;
    --dropdown-list-selected-background-color: #075985;

    // Switches
    --primary-switch-color: #075985;
    --primary-switch-color-off: #ccc;

    // Tables
    --table-border-color: #0f0f0f;
    --table-background-color: #18212f;
    --table-row-color-hover: #075985;
    --table-footer-background-color: #191919;

    // Names
    --winner-name-color: #13d90c;
    --loser-name-color: #ff7300;
    --name-hover-gradient-start: #5dc3f5;
    --name-hover-gradient-end: #000ac0;

    // Goals
    --standard-goal-color: rgba(51, 255, 0, 0.2);
    --own-goal-color: rgba(255, 0, 0, 0.4);

    // Statistics
    --chart-line-color: #5dc3f5;

    // Mentions
    --everyone-mention-color: rgb(252, 211, 77);
    --player-mention-color: rgb(252, 211, 77);
    
    
    --color-grey-0: #18212f;
    --color-grey-50: #111827;
    --color-grey-100: #1f2937;
    --color-grey-200: #374151;
    --color-grey-300: #4b5563;
    --color-grey-400: #6b7280;
    --color-grey-500: #9ca3af;
    --color-grey-600: #d1d5db;
    --color-grey-700: #e5e7eb;
    --color-grey-800: #f3f4f6;
    --color-grey-900: #f9fafb;

    --color-blue-100: #075985;
    --color-blue-700: #e0f2fe;
    --color-green-100: #166534;
    --color-green-700: #dcfce7;
    --color-yellow-100: #854d0e;
    --color-yellow-700: #fef9c3;
    --color-silver-100: #374151;
    --color-silver-700: #f3f4f6;
    --color-indigo-100: #3730a3;
    --color-indigo-700: #e0e7ff;

    --color-red-100: #fee2e2;
    --color-red-700: #b91c1c;
    --color-red-800: #991b1b;

    --backdrop-color: rgba(0, 0, 0, 0.3);

    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
    --shadow-md: 0px 0.6rem 2.4rem rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 2.4rem 3.2rem rgba(0, 0, 0, 0.4);

    --image-grayscale: 10%;
    --image-opacity: 90%;
  }

&, &.light-mode {

    // Backgrounds
    --primary-background-color: #fef4de;
    --secondary-background-color: #fffbeb;
    --tertiary-background-color: #fef3c7;

    // Text
    --primary-text-color: #000;
    --secondary-text-color: #666666;
    --tertiary-text-color: var(--color-grey-500);

    --link-text-color: #00a6ff;

    // Border
    --primary-border-color: #000;
    --secondary-border-color: var(--color-amber-100);

    // Pulse animation colors
    --pulse-color-transparent: rgba(235, 201, 33, 0);
    --pulse-color-heavily-transparent: rgba(235, 201, 33,  0.3);
    --pulse-color-medium-transparent: rgba(235, 201, 33,  0.4);
    --pulse-color-slightly-transparent: rgba(235, 201, 33, 0.7);

    // Disabled
    --disabled-color: #d1d5db;

    // NavBarLinks
    --nav-link-color: var(--color-grey-600);
    --nav-link-color-active: var(--color-grey-800);
    --nav-link-background-color-active: var(--color-amber-200); 
    --nav-link-svg-color: var(--color-grey-400);
    --nav-link-svg-color-active: #666666; 

    // Inputs
    --primary-input-border-color: #000;
    --primary-input-border-color-active: #1c62b9;
    --primary-input-background-color: #fddf335f;
    --primary-input-background-color-hover: #ffffff9a;

    --error-input-border-color: #ff0000;
    --error-input-background-color: #ffb6b69a;
    --error-input-background-color-hover: #ffa5a529;

    // Buttons
    --primary-button-color: #ebc921;
    --primary-button-color-hover: var(--color-amber-200);
    --primary-button-color-active: #c7a80b;
    --primary-button-color-text: #000000;

    --secondary-button-color: #d9d9d9;
    --secondary-button-color-active: #bcbcbc;
    --secondary-button-color-text: #000000;

    --danger-button-color: #d61313;
    --danger-button-color-active: #ff4848;
    --danger-button-color-text: #ffffff;

    // Dropdowns
    --primary-dropdown-background-color: #fddf335f;
    --primary-dropdown-background-color-hover: #ffffff9a;
    --primary-dropdown-text-color: #000000;
    --primary-dropdown-border-color: #000000;
    --dropdown-list-background-color: #fef3c7;
    --dropdown-list-selected-background-color: var(--color-amber-200);

    // Switches
    --primary-switch-color: var(--color-amber-400);
    --primary-switch-color-off: #ccc;

    // Tables
    --table-border-color: var(--color-amber-100);
    --table-background-color: var(--color-grey-0);
    --table-row-color-hover: var(--color-amber-50);
    --table-footer-background-color: var(--color-amber-50);

    // Names
    --winner-name-color: #008000;
    --loser-name-color: #ff0000;
    --name-hover-gradient-start: #cdc55a;
    --name-hover-gradient-end: #fd7a00;

    // Goals
    --standard-goal-color: rgba(90, 201, 0, 0.2);
    --own-goal-color: rgba(255, 0, 0, 0.4);

    // Statistics
    --chart-line-color: #0c00f3;

    // Mentions
    --everyone-mention-color: #00a6ff;
    --player-mention-color: #00a6ff;



    --color-amber-50: #fffbeb;
    --color-amber-75: #fef4de;
    --color-amber-100: #fef3c7;
    --color-amber-200: #fde68a;
    --color-amber-300: rgb(252, 211, 77);
    --color-amber-400: rgb(235, 202, 33);
    --color-amber-500: rgb(199, 168, 11);

  
  /* Grey */
  --color-grey-0: #fff;
  --color-grey-50: #f9fafb;
  --color-grey-100: #f3f4f6;
  --color-grey-200: #e5e7eb;
  --color-grey-300: #d1d5db;
  --color-grey-400: #9ca3af;
  --color-grey-500: #6b7280;
  --color-grey-600: #4b5563;
  --color-grey-700: #374151;
  --color-grey-800: #1f2937;
  --color-grey-900: #111827;

  --color-blue-100: #e0f2fe;
  --color-blue-700: #0369a1;
  --color-green-100: #dcfce7;
  --color-green-700: #15803d;
  --color-yellow-100: #fef9c3;
  --color-yellow-700: #a16207;
  --color-silver-100: #e5e7eb;
  --color-silver-700: #374151;
  --color-indigo-100: #e0e7ff;
  --color-indigo-700: #4338ca;

  --color-red-100: #fee2e2;
  --color-red-700: #b91c1c;
  --color-red-800: #991b1b;

  --backdrop-color: rgba(255, 255, 255, 0.1);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0px 0.6rem 2.4rem rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 2.4rem 3.2rem rgba(0, 0, 0, 0.12);

  /* For dark mode */
  --image-grayscale: 0;
  --image-opacity: 100%;

}

/* Indigo */
--color-brand-50: #eef2ff;
--color-brand-100: #e0e7ff;
--color-brand-200: #c7d2fe;
--color-brand-500: #6366f1;
--color-brand-600: #4f46e5;
--color-brand-700: #4338ca;
--color-brand-800: #3730a3;
--color-brand-900: #312e81;



--border-radius-tiny: 3px;
--border-radius-sm: 5px;
--border-radius-md: 7px;
--border-radius-lg: 9px;

/* MMR Rating Colors (CS2-inspired) */
--mmr-grey: #A0A0A0;
--mmr-cyan: #4BB7FF;
--mmr-blue: #0066FF;
--mmr-purple: #C74BFF;
--mmr-pink: #FF4BC7;
--mmr-red: #FF3B3B;
--mmr-gold: #FFD700;
--mmr-gold-light: #FFF8DC;

}



*,
*::before,
*::after {
  box-sizing: border-box;
  padding: 0;
  margin: 0;

  /* Creating animations for dark mode */
  transition: background-color 0.3s, border 0.3s;
}


html {
  font-size: 62.5%;
}

body {
  font-family: "Poppins", sans-serif;
  color: var(--color-grey-700);
  background-color: var(--secondary-background-color);

  transition: color 0.3s, background-color 0.3s;
  min-height: 100vh;
  line-height: 1.5;
  font-size: 1.6rem;
}

input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;

  // Disables selecting of the inner button text
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none;   /* Safari */
  -khtml-user-select: none;    /* Konqueror HTML */
  -moz-user-select: none;      /* Old versions of Firefox */
  -ms-user-select: none;       /* Internet Explorer/Edge */
  user-select: none;           /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
}

*:disabled {
  cursor: not-allowed;
}



a {
  color: inherit;
  text-decoration: none;
}

ul {
    list-style: none;
}
`;

export default GlobalStyles;
