import React from 'react';
import {createRoot} from 'react-dom/client';
import {initialiseEstateTheme} from '@sangeev/estate-ui';
import '@sangeev/estate-ui/contract.css';
import './project.css';
import {Landing} from './Landing.jsx';
initialiseEstateTheme();createRoot(document.getElementById('root')).render(<Landing/>);
