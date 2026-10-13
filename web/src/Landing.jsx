import React from 'react';
import {PublicEstateHeader,EstateShell,EstatePageTitle,useEstateTheme} from '@sangeev/estate-ui';
export function Landing(){const {theme,toggleTheme}=useEstateTheme();return <>
<a className="skip-link" href="#main-content">Skip to content</a>
<PublicEstateHeader navigation="projects" theme={theme} onToggleTheme={toggleTheme}/>
<EstateShell variant="landing"><main id="main-content" tabIndex={-1} className="project-page">
<section className="project-intro" aria-labelledby="title"><a className="back-link" href="https://sangeev.me/#projects">← Projects</a>
<EstatePageTitle variant="landing" id="title">Glassbox</EstatePageTitle>
<p className="project-summary">A browser lab for exploring physiological mechanisms.</p>
<p className="project-lede">Make a prediction, watch a recorded experiment and pause to compare what changed. Three guided lessons connect the measurements to the mechanisms behind them.</p>
<div className="project-actions"><a id="start-lab" className="estate-primary-action" href="./lab.html">Open lab <span className="action-arrow" aria-hidden="true">→</span></a></div></section>
<section className="project-evidence" aria-labelledby="evidence-title"><h2 id="evidence-title" className="estate-section-title">Inside a lesson</h2><figure className="estate-evidence-frame"><img src="./images/pressure-comparison.png" width="1132" height="991" alt="Blood-loss lesson comparing blood volume, mean arterial pressure, heart rate and stroke volume with the unchanged recording."/></figure></section>
</main><footer className="project-footer"><a href="./licences.html">About &amp; licences</a></footer></EstateShell></>}
