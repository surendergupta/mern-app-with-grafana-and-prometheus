const tripModel = require('../models/trip.model')
const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const { trace } = require('@opentelemetry/api');
const options = {
    transports: [
      new LokiTransport({
        labels: {
            appName: 'Express node js'
        },
        host: "http://172.21.61.204:3100"
      })
    ]
};
const logger = createLogger(options);
async function tripAdditionController(req, res){
    const tracer = trace.getTracer('travel-memory-backend-route');
    const span = tracer.startSpan('POST /trip/');
    try
    {   
        let tripDetail = tripModel.Trip({
            tripName: req.body.tripName,
            startDateOfJourney: req.body.startDateOfJourney,
            endDateOfJourney: req.body.endDateOfJourney,
            nameOfHotels: req.body.nameOfHotels,
            placesVisited: req.body.placesVisited,
            totalCost: req.body.totalCost,
            tripType: req.body.tripType,
            experience: req.body.experience,
            image: req.body.image,
            shortDescription: req.body.shortDescription,
            featured: req.body.featured
        })
        await tripDetail.save()
        logger.info('Trip added Successfully by post request /trip')
        span.end();
        res.send('Trip added Successfully')
    }catch(error){
        logger.error('Error through post request /trip', error.message);
        span.end();
        res.send('SOMETHING WENT WRONG')
    }
}

async function getTripDetailsController(req,res){
    const tracer = trace.getTracer('travel-memory-backend-route');
    const span = tracer.startSpan('GET /trip/');
    try{
        let doc = await tripModel.Trip.find({})
        logger.info('Trip fetched Successfully by get request /trip')
        span.end();
        res.send(doc);
    }
    catch(error)
    {
        logger.error('Trip fetched Successfully by get request /trip', error.message);
        span.end();
        res.send('SOMETHING WENT WRONG')
    }
}

async function getTripDetailsByIdController(req,res){
    const tracer = trace.getTracer('travel-memory-backend-route');
    const span = tracer.startSpan('GET /trip/:id');
    try{
        let doc = await tripModel.Trip.findById(req.params.id)
        logger.info('Trip fetched Successfully get request by id /trip/id')
        span.end();
        res.send(doc);
    }catch(error){
        logger.error('Error: Trip fetched Successfully get request by id /trip/id', error.message)
        span.end();
        res.send('SOMETHING WENT WRONG')
    }
}
module.exports = { tripAdditionController, getTripDetailsController, getTripDetailsByIdController }