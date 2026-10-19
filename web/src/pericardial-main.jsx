import React from 'react';
import {createRoot} from 'react-dom/client';
import {initialiseEstateTheme} from '@sangeev/estate-ui';
import '@sangeev/estate-ui/contract.css';
import './pericardial.css';
import {PericardialApp} from './PericardialApp.jsx';
initialiseEstateTheme();
createRoot(document.getElementById('root')).render(<PericardialApp/>);
