import React from 'react';
import {createRoot} from 'react-dom/client';
import {initialiseEstateTheme} from '@sangeev/estate-ui';
import '@sangeev/estate-ui/contract.css';
import './respiratory.css';
import {RespiratoryApp} from './RespiratoryApp.jsx';
initialiseEstateTheme();
createRoot(document.getElementById('root')).render(<RespiratoryApp/>);
