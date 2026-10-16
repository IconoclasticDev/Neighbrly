"""Run: python -m uvicorn app:app --host 127.0.0.1 --port 8000 (from backend/)."""
import os
from typing import Annotated, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from engine import AREAS, DATA, DEFAULT_WEIGHTS, build_report, weights_from_answers

app = FastAPI(title='Neighbrly demo API', version='0.1.0', description='All observations and scores are invented demonstration fixtures. No live source adapters are connected.')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('NEIGHBRLY_ORIGINS', 'http://127.0.0.1:5173,http://localhost:5173').split(','), allow_methods=['GET','POST'], allow_headers=['Content-Type'])
Weight = Annotated[float, Field(ge=1, le=9, allow_inf_nan=False)]
class ReportRequest(BaseModel):
    area_id: Literal['a','b','c']
    weights: dict[str, Weight] = Field(default_factory=lambda: DEFAULT_WEIGHTS.copy())
class CompareRequest(BaseModel):
    first: Literal['a','b','c']
    second: Literal['a','b','c']
    weights: dict[str, Weight] = Field(default_factory=lambda: DEFAULT_WEIGHTS.copy())
class QuizRequest(BaseModel):
    answers: list[str] = Field(min_length=len(DATA['quiz']), max_length=len(DATA['quiz']))

def make_report(area_id, weights):
    try:
        return build_report(area_id, weights)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

@app.get('/health')
def health():
    return {'status':'ok','mode':'demo','live_adapters':False}
@app.get('/v1/areas')
def areas():
    return {'demo':True,'areas':[{'id':a['id'],'name':a['name'],'tagline':a['tagline'],'illustrative_lat':a['lat'],'illustrative_lng':a['lng']} for a in AREAS.values()]}
@app.get('/v1/quiz')
def quiz():
    return {'version':'balanced-v2','questions':DATA['quiz']}
@app.post('/v1/quiz')
def submit_quiz(body: QuizRequest):
    try:
        return {'weights':weights_from_answers(body.answers),'quiz_version':'balanced-v2'}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
@app.post('/v1/report')
def report(body: ReportRequest):
    return make_report(body.area_id,body.weights)
@app.post('/v1/compare')
def compare(body: CompareRequest):
    if body.first == body.second:
        raise HTTPException(422,'Choose two different localities.')
    first, second = make_report(body.first,body.weights), make_report(body.second,body.weights)
    return {'demo':True,'first':first,'second':second,'bounds_overlap':max(first['lo'],second['lo'])<=min(first['hi'],second['hi'])}
