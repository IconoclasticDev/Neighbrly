import {score,summary,checklist as items} from '../../shared/core';
export {DEFAULT_WEIGHTS,weightsFromAnswers} from '../../shared/core';
export type {Weights} from '../../shared/core';
export const computeScore=score;
export const summarise=summary;
export const checklist=(area:Parameters<typeof items>[0],w:Parameters<typeof items>[1])=>items(area,w).map(x=>`${x.title}. ${x.text}`);
export {getArea} from './data';
