import React from 'react';
import {PublicEstateHeader,EstateShell,EstatePageTitle,useEstateTheme} from '@sangeev/estate-ui';
export function Lab(){const {theme,toggleTheme}=useEstateTheme();return <>
<a className="skip-link" href="#main-content">Skip to experiments</a>
<PublicEstateHeader navigation="projects" theme={theme} onToggleTheme={toggleTheme}/>
<EstateShell variant="landing"><main id="main-content" tabIndex={-1} className="lab-page">
<header className="lab-intro"><a className="back-link" href="./">← Glassbox</a>
<EstatePageTitle variant="app">Choose an experiment</EstatePageTitle>
<p>Start anywhere. Each lesson begins with a prediction.</p></header>
<section className="lesson-register" aria-label="Experiments">
<article className="lesson-row"><h2 className="estate-section-title"><a className="lesson-link" href="./app/">Pressure is not volume <span aria-hidden="true">→</span></a></h2><p>Watch blood loss and compare pressure with the amount of blood in circulation.</p></article>
<article className="lesson-row"><h2 className="estate-section-title"><a className="lesson-link" href="./app/oxygen.html">Saturation is not delivery <span aria-hidden="true">→</span></a></h2><p>Compare oxygen saturation, haemoglobin, oxygen content and blood flow.</p></article>
<article className="lesson-row"><h2 className="estate-section-title"><a className="lesson-link" href="./app/respiratory.html">Where does the breath go? <span aria-hidden="true">→</span></a></h2><p>Compare higher airway resistance with lower lung compliance under the same breathing input.</p></article>
</section></main><footer className="project-footer"><a href="./licences.html">About &amp; licences</a></footer></EstateShell></>}
