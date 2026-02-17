// Importeer het npm package Express (uit de door npm aangemaakte node_modules map)
// Deze package is geïnstalleerd via `npm install`, en staat als 'dependency' in package.json
import express, { response } from 'express'

// Importeer de Liquid package (ook als dependency via npm geïnstalleerd)
import { Liquid } from 'liquidjs';

// Je kunt de volgende URLs uit onze API gebruiken:
// - https://fdnd.directus.app/items/tribe
// - https://fdnd.directus.app/items/squad
// - https://fdnd.directus.app/items/person
// En combineren met verschillende query parameters als filter, sort, search, etc.
// Gebruik hiervoor de documentatie van https://directus.io/docs/guides/connect/query-parameters
// En de oefeningen uit https://github.com/fdnd-task/connect-your-tribe-squad-page/blob/main/docs/squad-page-ontwerpen.md

// Haal bijvoorbeeld alle eerstejaars squads van dit jaar uit de WHOIS API op (2025–2026)
const params = {
  'filter[cohort]': '2526',
  'filter[tribe][name]': 'FDND Jaar 1'
}
const squadResponse = await fetch('https://fdnd.directus.app/items/squad?' + new URLSearchParams(params))

// Lees van de response van die fetch het JSON object in, waar we iets mee kunnen doen
const squadResponseJSON = await squadResponse.json()

// Controleer eventueel de data in je console
// (Let op: dit is _niet_ de console van je browser, maar van NodeJS, in je terminal)
// console.log(squadResponseJSON)


// Maak een nieuwe Express applicatie aan, waarin we de server configureren
const app = express()

// Gebruik de map 'public' voor statische bestanden (resources zoals CSS, JavaScript, afbeeldingen en fonts)
// Bestanden in deze map kunnen dus door de browser gebruikt worden
app.use(express.static('public'))

// Stel Liquid in als 'view engine'
const engine = new Liquid();
app.engine('liquid', engine.express()); 

// Stel de map met Liquid templates in
// Let op: de browser kan deze bestanden niet rechtstreeks laden (zoals voorheen met HTML bestanden)
app.set('views', './views')

// Zorg dat werken met request data (volgende week) makkelijker wordt
app.use(express.urlencoded({extended: true}))


app.get('/', async function (request, response) {
  const params = {
    'sort': 'name',
    'fields': '*,squads.*',
    'filter[squads][squad_id][tribe][name]': 'FDND Jaar 1',
    'filter[squads][squad_id][cohort]': '2526',
  }

  let sortInfo
  let squadInfo = 'alle sqauds'

  // Sorteren op naam
  if (request.query.sort == 'za') {
    params['sort'] = '-name'
    sortInfo = 'Z-A'
  } 
  else {
    params['sort'] = 'name'
    sortInfo = 'A-Z'
  }

  // Filteren op sqaud
  if (request.query.squad == '1I') {
    params['filter[squads][squad_id][_eq]'] = 16
    squadInfo = '1I'
  }

  if (request.query.squad == '1J') {
    params['filter[squads][squad_id][_eq]'] = 17
    squadInfo = '1J'
  }

  // Zoeken op naam 
  if (request.query.name) {
    params['filter[name][_icontains]'] = request.query.name
  }

  const personResponse = await fetch('https://fdnd.directus.app/items/person/?' + new URLSearchParams(params))
  const personResponseJSON = await personResponse.json()
  response.render('index.liquid', {persons: personResponseJSON.data, squads: squadResponseJSON.data, sortInfo: sortInfo, squadInfo: squadInfo, title: "FDND jaar 1"})
})




// Maak een POST route voor de index; hiermee kun je bijvoorbeeld formulieren afvangen
app.post('/', async function (request, response) {
  // Je zou hier data kunnen opslaan, of veranderen, of wat je maar wilt
  // Er is nog geen afhandeling van POST, redirect naar GET op /
  response.redirect(303, '/')
})


// Maak een GET route voor een detailpagina met een route parameter, id
// Zie de documentatie van Express voor meer info: https://expressjs.com/en/guide/routing.html#route-parameters
app.get('/student/:id', async function (request, response) {
  // Gebruik de request parameter id en haal de juiste persoon uit de WHOIS API op
  const personDetailResponse = await fetch('https://fdnd.directus.app/items/person/' + request.params.id)
  // En haal daarvan de JSON op
  const personDetailResponseJSON = await personDetailResponse.json()
  
  // Render student.liquid uit de views map en geef de opgehaalde data mee als variable, genaamd person
  // Geef ook de eerder opgehaalde squad data mee aan de view
  response.render('student.liquid', {person: personDetailResponseJSON.data, squads: squadResponseJSON.data})
})


// Stel het poortnummer in waar express op moet gaan luisteren
app.set('port', process.env.PORT || 8000)

// Start express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get('port')}`)
})

app.get('/berichten', async function (request, response) {
  const params = {
    'filter[for]': 'roxy-demo'
  }

  const apiURL ='https://fdnd.directus.app/items/messages?' + new URLSearchParams(params)
  const messagesResponse = await fetch(apiURL)
  const messagesResponseJSON = await messagesResponse.json()
  const messages = messagesResponseJSON.data

  response.render('messages.liquid', { messages });
});

app.post('/berichten', async function(request, response) {
  
  // Stuur een POST request naar de messages database
  // Een POST request bevat ook extra parameters, naast een URL
  await fetch('https://fdnd.directus.app/items/messages', {

    // Overschrijf de standaard GET method, want ook hier gaan we iets veranderen op de server
    method: 'POST',

    // Geef de body mee als JSON string
    body: JSON.stringify({
      // Dit is zodat we ons bericht straks weer terug kunnen vinden met ons filter
      for: 'roxy-demo',
      // En dit is ons eerdere formulierveld
      from: request.body.from,
      text: request.body.message
    }),

    // En vergeet deze HTTP headers niet: hiermee vertellen we de server dat we JSON doorsturen
    // (In realistischere projecten zou je hier ook authentication headers of een sleutel meegeven)
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }

  })
   response.redirect('/berichten')
})