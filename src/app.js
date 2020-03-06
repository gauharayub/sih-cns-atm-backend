const express = require('express')
const mongoose = require('mongoose')
const Location = require('./models/location')
const Equipment = require('./models/equipment-model')
const MaintenancePlan = require('./models/maintenance-plan')
const Order = require('./models/orders')
const cron = require('node-cron')
const timespan = require('timespan')
require('./db/mongoose')
const router = require('./routers/routes')
const history = require('./routers/history-routes')


//creates an express web-server
const app=express()

const port = process.env.PORT
//middleware function that recognizes request data as json and parses it to object(req.body)....
app.use(express.json())

//register routers on express app....
app.use(router)
app.use(history)

var num = 1111
//function to generate orders every cycle of task.
const orderGeneration = async()=>{
//runs every second
    cron.schedule('*/1 * * * * *',async ()=>{
        const locations = await Location.find()
        const equipment = await Equipment.find()
        for(let i=0;i<locations.length;i++){
            await locations[i].populate('equipment').execPopulate()
            await locations[i].populate('equipment.maintenancePlanList').execPopulate()
            const maintenanceList = locations[i].equipment.maintenancePlanList
        
            for(let j=0;j<maintenanceList.length;j++){
                let current = Date.now()
                let updated = Date.parse(maintenanceList[j].updatedAt)

//calculate time-diifference between current time and last update time....          
                let tspan = new timespan.TimeSpan(current-updated)

//parse months from cycle string.....
                let cycle = maintenanceList[j].cycle
                let days = 1
                if(cycle=="daily"){
                    days = 1
                }
                else if(cycle=="weekly"){
                    days = 7
                }
                else{
                    month= parseInt(cycle.replace(/[^0-9\.]/g, ''), 10)
                    days  = month*30
                }

//check if cycle is reached or not.....            
                if(tspan.totalDays()>=days){
//create new order if cycle has completed for task....         
                    const order = new Order({
                        number:num,
                        assignmentCode:'T-400',
                        equipment:maintenanceList[j].equipment,
                        work:'Cleaning of metal-part',
                        task:maintenanceList[j].task,
                        location:locations[i].description,
                        cycle:maintenanceList[j].cycle,
                        equipmentCode:locations[i].equipment.equipmentCode
                    })
                    num++
                        await order.save()
                        maintenanceList[j].updatedAt = current
                        await maintenanceList[j].save()
                        console.log(order)
                    }
                }
        }
    })
}

orderGeneration()


//listen on specified port.....
app.listen(port,()=>{
    console.log('Server is up on port ' + port)
})