import { Readable, Transform, Writable } from 'stream';
import { jest } from '@jest/globals'
export default class TestUtil {

    static mockDateNow(mockImplementationPeriods) {
        const now = jest.spyOn(global.Date, global.Date.now.name)

        mockImplementationPeriods.forEach(time => {
            now.mockReturnValueOnce(time)
        })
    }

    static getTimeFromDate(dateString) {
        return new Date(dateString).getTime()
    }

    static generateReadableStream(data) {
        return new Readable({
            objectMode: true,
            read() {
                for(const item of data) {
                    this.push(item);
                }
                this.push(null);
            }
        })
    }

    static generateWritableStream(onData) {
        return new Writable({
            objectMode: true,
            write(chunk, enconding, cb) {
                onData(chunk)

                cb(null, chunk)
            }
        })
    }

    static generateTransformStream(onData) {
        return new Transform({
            objectMode: true,
            transform(chunk, enconding, cb) {
                onData(chunk)
                cb(null, chunk)
            }
        })
    }
}