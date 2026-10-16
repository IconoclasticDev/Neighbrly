export const FEATURES=[
 {id:'livability',title:'A feel for everyday life.',tag:'Livability',image:'/images/hero-mumbai.jpg',alt:'The Gateway of India and people visiting the plaza in Mumbai',description:'Schools, green spaces, air quality and the connections that shape your day.',detail:'Look at the individual metrics, their coverage and your priorities together. A single headline score cannot describe every street or building.'},
 {id:'pricing',title:'A price with perspective.',tag:'Value',image:'/images/sealink-mumbai.jpg',alt:'Bandra–Worli Sea Link and Mumbai buildings in the distance',description:'Put an asking price beside available registered transactions. See the gaps, too.',detail:'A useful comparison needs matching property type, area basis, geography and date window. Our demo uses invented transactions and does not establish a property valuation.'},
 {id:'promoter',title:'The record behind the promise.',tag:'Trust',image:'/images/promoter-record.jpg',alt:'An architect reviewing a building plan at a desk',description:'Explore delivery history and project records, where suitable evidence is available.',detail:'A promoter must be correctly matched to a project. Missing or unmatched records stay unavailable. A complaint count alone does not establish wrongdoing.'},
] as const;
export const SOURCE_CATEGORIES=[
 {icon:'document',title:'Public & regulatory records',description:'Dated records with visible scope.'},
 {icon:'pin',title:'Geographic datasets',description:'Location context and mapped access.'},
 {icon:'building',title:'Municipal amenities',description:'Everyday services and infrastructure.'},
 {icon:'record',title:'Project documents',description:'Delivery and promoter evidence.'},
 {icon:'rupee',title:'Registered transactions',description:'Comparable evidence for price context.'},
] as const;
export const FAQ=[
 {q:'Are these real neighbourhood assessments?',a:'No. Every score, price, project and observation in the interactive reports is invented demonstration data. Real Mumbai photography and boundaries provide context; they do not verify the report figures.'},
 {q:'What do the score ranges mean?',a:'The observed score averages the available metrics using your weights. Missing-data bounds show the lowest and highest overall outcomes if missing metrics were assigned 0 or 100. They are sensitivity bounds, not a statistical confidence interval.'},
 {q:'Can I use this to decide whether to buy a property?',a:'Use the demo to explore the proposed workflow. Verify property-specific evidence, visit the locality and obtain the relevant professional advice before making a transaction.'},
] as const;
