"""Deterministic demonstration engine. This module does not ingest real Mumbai evidence."""
import json
import math
from pathlib import Path

DATA = json.loads((Path(__file__).resolve().parents[1] / 'shared' / 'demo.json').read_text(encoding='utf-8'))
METRICS = DATA['metrics']
IDS = [m['id'] for m in METRICS]
AREAS = {a['id']: a for a in DATA['areas']}
DEFAULT_WEIGHTS = dict.fromkeys(IDS, 1)

def validate_weights(weights):
    if set(weights) != set(IDS) or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not 1 <= v <= 9 for v in weights.values()):
        raise ValueError('Supply each of the seven metric weights between 1 and 9.')

def weights_from_answers(answers):
    if len(answers) != len(DATA['quiz']):
        raise ValueError('Exactly seven quiz answers are required.')
    weights = DEFAULT_WEIGHTS.copy()
    for question, answer in zip(DATA['quiz'], answers):
        if answer not in (question['a']['m'], question['b']['m']):
            raise ValueError('Answer does not match its quiz question.')
        weights[answer] += 1
    return weights

def build_report(area_id, weights):
    validate_weights(weights)
    area = AREAS[area_id]
    known = [(m, area['entries'][m['id']]) for m in METRICS if area['entries'][m['id']]['value'] is not None]
    numerator = sum(e['value'] * weights[m['id']] for m, e in known)
    known_wseven = sum(weights[m['id']] for m, _ in known)
    total_wseven = sum(weights.values())
    coverage = known_wseven / total_wseven
    score = math.floor(numerator / known_wseven + .5) if len(known) >= 3 and coverage >= .5 else None
    ranked = sorted(known, key=lambda r: weights[r[0]['id']] * abs(r[1]['value'] - 60), reverse=True)
    summaries = []
    for m, e in ranked[:3]:
        tone = 'is a strength' if e['value'] >= 75 else 'is mixed' if e['value'] >= 55 else 'needs a closer look'
        summaries.append({'text': f"{m['label']} {tone}: {e['raw']} (score {e['value']}).", 'ref': e['ref'], 'metric': m['id']})
    checklist = []
    for m in sorted(METRICS, key=lambda m: weights[m['id']], reverse=True):
        e = area['entries'][m['id']]
        if e['value'] is None:
            checklist.append({'id': m['id'], 'title': f"Verify {m['label'].lower()}", 'text': 'No data yet. ' + m['verify']})
        elif e['value'] < 55:
            checklist.append({'id': m['id'], 'title': f"Check {m['label'].lower()}", 'text': m['verify']})
    checklist += [{'id':'rera','title':'Check project registration','text':'Ask for the RERA registration number and read the project complaint history.'}, {'id':'deeds','title':'Ask for registered deals','text':'Compare recent registered sale deeds with the asking price for the same building and property type.'}]
    result = {'areaId': area['id'], 'areaName': area['name'], 'demo': True, 'methodVersion': 'demo-bounds-v2', 'asOf': '2026-10-01', 'score': score, 'lo': math.floor(numerator / total_wseven), 'hi': math.ceil((numerator + 100 * (total_wseven-known_wseven)) / total_wseven), 'used': len(known), 'total': len(METRICS), 'coverage': math.floor(100*coverage+.5), 'ledger': [{'metric': m['id'], 'label': m['label'], **area['entries'][m['id']]} for m in METRICS], 'summary': summaries, 'checklist': checklist}
    validate_summary(result)
    return result

def validate_summary(report):
    """Allow only exact deterministic claims grounded in the referenced observation.

    Deliberately not an LLM validator: arbitrary generated text is rejected, including
    numbers copied from a different metric, changed units, dates, or entity names.
    """
    ledger = {e['ref']: e for e in report['ledger']}
    for claim in report['summary']:
        e = ledger.get(claim.get('ref'))
        if not e or e['value'] is None or claim.get('metric') != e['metric']:
            raise ValueError('Unsupported claim reference.')
        tone = 'is a strength' if e['value'] >= 75 else 'is mixed' if e['value'] >= 55 else 'needs a closer look'
        allowed = f"{e['label']} {tone}: {e['raw']} (score {e['value']})."
        if claim.get('text') != allowed:
            raise ValueError('Claim differs from its supported evidence template.')
