import { Request, Response } from 'express'

import db from '../database/connection';
import convertHourToMinute from '../utils/convertHoursToMinutes';

interface ScheduleItem {
    week_day: number;
    from: string;
    to: string;
}

export default class ClassController {
    async index (request: Request, response: Response) {
        const filters = request.query;

        if (!filters.subject || !filters.week_day || !filters.time ) {
            return response.status(400).json({
                error: 'Missing filters to search classes'
            });
        }

        const subject = filters.subject as string;
        const week_day = filters.week_day as string;

        const time = filters.time as string;

        const timeInMinute = convertHourToMinute(time);

        const classes = await db('classes')
        .whereExists(function() {
            this.select('class-schedule.*')
            .from('class-schedule')
            .whereRaw('`class-schedule`.`class_id` = `classes`.`id`')
            .whereRaw('`class-schedule`.`week_day` = ??', [Number(week_day)])
            .whereRaw('`class-schedule`.`from` <= ??', [timeInMinute])
            .whereRaw('`class-schedule`.`to` > ??', [timeInMinute])
        })
        .where('classes.subject', '=', subject)
        .join ('users', 'classes.user_id', '=', 'users.id')
        .select(['classes.*', 'users.*']);

        return response.json(classes);
    }


    async create (request: Request, response: Response) {
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = request.body;
    
        const trx = await db.transaction();
    
        try {
            const insertedUsersIds = await trx('users').insert({
                name,
                avatar,
                whatsapp,
                bio,
            });
        
            const user_id = insertedUsersIds [0];
        
            const insertedClassesId = await trx('classes').insert({
                subject,
                cost,
                user_id,
            });
            
            const class_id = insertedClassesId[0];
        
            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinute(scheduleItem.from),
                    to: convertHourToMinute(scheduleItem.to),
                    class_id,
                };
            })
        
            await trx('class-schedule').insert(classSchedule);
        
            await trx.commit();
            
            return response.status(201).send(); 
        } catch (err) {
            await trx.rollback();
    
            return response.status(400).json({
                error: 'Unexpected  error while creating new class'
            });
        }
    }
}