import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from engine import AREAS, DATA, DEFAULT_WEIGHTS, build_report, validate_summary, weights_from_answers
from fastapi.testclient import TestClient
from app import app

class EngineTests(unittest.TestCase):
    def test_quiz_is_balanced(self):
        counts=dict.fromkeys(DEFAULT_WEIGHTS,0)
        for q in DATA['quiz']:
            for side in ['a','b']: counts[q[side]['m']]+=1
        self.assertEqual(set(counts.values()),{2})
    def test_no_data_has_no_score(self):
        old=copy.deepcopy(AREAS['a'])
        try:
            for e in AREAS['a']['entries'].values():e['value']=None
            r=build_report('a',DEFAULT_WEIGHTS)
            self.assertIsNone(r['score']);self.assertEqual((r['lo'],r['hi']),(0,100))
        finally:AREAS['a']=old
    def test_high_missing_weight_blocks_score(self):
        weights={**DEFAULT_WEIGHTS,'value':9}
        self.assertIsNone(build_report('a',weights)['score'])
    def test_known_fixture_and_bounds(self):
        r=build_report('a',DEFAULT_WEIGHTS)
        self.assertEqual((r['score'],r['used'],r['lo'],r['hi']),(63,6,53,68))
    def test_adversarial_claims(self):
        for i in range(120):
            r=build_report('b',DEFAULT_WEIGHTS)
            r['summary'][0]['text']=r['summary'][0]['text'].replace('score ',f'score {i} ')
            with self.assertRaises(ValueError):validate_summary(r)
        r=build_report('b',DEFAULT_WEIGHTS);r['summary'][0]['ref']=1
        with self.assertRaises(ValueError):validate_summary(r)
    def test_missing_detail_consistency(self):
        self.assertIsNone(AREAS['a']['price']);self.assertIsNone(AREAS['c']['promoter'])
    def test_api_validation(self):
        c=TestClient(app)
        self.assertEqual(c.post('/v1/report',json={'area_id':'a'}).status_code,200)
        self.assertEqual(c.post('/v1/report',json={'area_id':'unknown'}).status_code,422)
        self.assertEqual(c.post('/v1/report',json={'area_id':'a','weights':{'air':1}}).status_code,422)
        self.assertEqual(c.post('/v1/compare',json={'first':'a','second':'a'}).status_code,422)
        answers=[q['a']['m'] for q in DATA['quiz']]
        self.assertEqual(c.post('/v1/quiz',json={'answers':answers}).status_code,200)
        answers[0]='air'
        self.assertEqual(c.post('/v1/quiz',json={'answers':answers}).status_code,422)

if __name__=='__main__':unittest.main()
