import React from 'react';
import {createRoot} from 'react-dom/client';
import {initialiseEstateTheme} from '@sangeev/estate-ui';
import '@sangeev/estate-ui/contract.css';
import './lesson.css';
import './oxygen.css';
import {OxygenApp} from './OxygenApp.jsx';
initialiseEstateTheme();
createRoot(document.getElementById('root')).render(<OxygenApp/>);
