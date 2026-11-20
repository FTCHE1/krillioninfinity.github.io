"""Compile the authored question sets into a structured, portable JSON seed.
Run: python3 scripts/generate-questions.py. No network or runtime generation.
Rarity is an editorial estimate, not measured player frequency.
"""
import json, unicodedata, re
from pathlib import Path
root = Path(__file__).resolve().parent.parent
normalize = lambda s: re.sub('[^a-z0-9]', '', unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower().replace('&',' and '))
refs = {'Sports':'Olympics event programmes and governing-body competition archives', 'Basketball':'NBA historical player and franchise records; official basketball rules', 'Soccer':'FIFA and UEFA historical competition archives', 'Football':'NFL historical franchise, Super Bowl and Hall of Fame records', 'Baseball':'MLB historical franchise, World Series and player records', 'Music':'Artist discographies and published music reference works', 'Movies and television':'Film credits, studio catalogues and Academy Awards archives', 'Geography':'UN member list, national geography references and UNESCO listings', 'Food and drinks':'Established culinary ingredient and dish classifications', 'Animals':'IUCN species accounts and standard zoological classifications', 'Science':'Standard school-level scientific reference definitions', 'History':'Encyclopaedia Britannica historical entries and museum references', 'Technology':'Manufacturer product histories and official technical documentation', 'Brands and products':'Official brand product catalogues and company histories', 'Books and fictional characters':'Original published works and publisher catalogues', 'Everyday knowledge':'Standard dictionary definitions and everyday object classifications'}
aliases = {'LeBron James':['LeBron','King James'], 'Stephen Curry':['Steph Curry','Steph'], 'Giannis Antetokounmpo':['Giannis'], 'Nikola Jokic':['Jokic'], 'United States':['USA','US','United States of America'], 'United Kingdom':['UK','Britain','Great Britain'], 'United Arab Emirates':['UAE'], 'Czechia':['Czech Republic'], 'South Korea':['Republic of Korea'], 'Ivory Coast':["Cote d Ivoire"], 'New York Yankees':['Yankees','NY Yankees'], 'Los Angeles Lakers':['Lakers','LA Lakers'], 'Golden State Warriors':['Warriors'], 'Manchester United':['Man United','Man Utd'], 'Paris Saint-Germain':['PSG'], 'Cristiano Ronaldo':['Cristiano','CR7'], 'Lionel Messi':['Messi','Leo Messi'], 'Tom Brady':['Brady'], 'Spider-Man':['Spiderman'], 'Batman':['Bruce Wayne'], 'Superman':['Clark Kent'], 'Harry Potter':['Harry'], 'Nintendo Entertainment System':['NES'], 'Super Nintendo':['SNES','Super Nintendo Entertainment System'], 'PlayStation':['PS1','PlayStation 1'], 'PlayStation 2':['PS2'], 'PlayStation 3':['PS3'], 'PlayStation 4':['PS4'], 'PlayStation 5':['PS5'], 'Xbox 360':['XBox360'], 'Mac OS':['macOS'], 'Lord of the Rings':['The Lord of the Rings'], 'The Beatles':['Beatles'], 'Table tennis':['Ping pong'], 'Football':['Soccer'], 'Athletics':['Track and field'], '100 metres':['100m','100 meters'], '200 metres':['200m','200 meters'], '400 metres':['400m','400 meters'], '800 metres':['800m','800 meters'], '1500 metres':['1500m','1500 meters'], '5000 metres':['5000m','5000 meters'], '10000 metres':['10000m','10000 meters']}
records=[]; category=''; count={}
for line in (root/'scripts/question-sets.txt').read_text().splitlines():
    if not line.strip(): continue
    if line.startswith('['): category=line[1:-1]; count[category]=0; continue
    prompt, raw = line.split('|',1)
    names = raw.split(';'); count[category]+=1
    idx=count[category]
    difficulty='easy' if idx in [1,9,17,25] else 'hard' if idx in [8,24] else 'medium'
    answers=[]
    for i,name in enumerate(names):
        rarity = 'Common' if i<2 else 'Uncommon' if i<5 else 'Rare' if i<9 else 'Legendary'
        # Frequency estimates are deliberately editorial; rare choices remain recognizable.
        answers.append(dict(text=name,normalized=normalize(name),aliases=aliases.get(name,[]),rarity=rarity,points={'Common':10,'Uncommon':25,'Rare':50,'Legendary':100}[rarity],explanation=f'{name} fits this prompt: {prompt.removeprefix("Name ").rstrip(".")}.' ))
    records.append(dict(id=f'q-{len(records)+1:04}',prompt=prompt,category=category,difficulty=difficulty,status='active',dateAdded='2026-11-20',verification=f'Editorial reference: {refs[category]}. Historical cutoffs appear in the prompt where relevant. Accepted sets are curated, not exhaustive; review submitted omissions. Rarity estimates are editorial, not observed response rates.',answers=answers))
assert len(records)>=500, len(records)
assert len(set(normalize(q['prompt']) for q in records)) == len(records)
assert all(n>=30 for n in count.values()),count
(root/'src/data/questions.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print(f'{len(records)} questions, {sum(len(q["answers"]) for q in records)} accepted answers. Categories: {count}')
