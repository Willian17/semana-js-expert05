import {
    describe,
    test,
    expect,
    beforeEach,
    jest
} from '@jest/globals'
import fs from 'fs';
import { pipeline } from 'stream/promises'
import { resolve } from 'path';
import UploadHandler from '../../src/uploadHandler'
import TestUtil from '../_util/testUtil'
import { logger } from '../../src/logger';

describe('#UploadHandler test suite', () => {
    const ioObject = {
        to: (id) => ioObject,
        emit: (event, message) => {}
    }
    beforeEach(() => {
        jest.spyOn(logger, 'info')
            .mockImplementation()
    })
    describe('#registerEvents', () => {
        test('should call onFile and onFinish functions on Busboy instance', () => {
            const uploadHandler = new UploadHandler({
                io: ioObject,
                socketId: '01'
            })

            jest.spyOn(uploadHandler, uploadHandler.onFile.name)
                .mockResolvedValue()
            
            const headers = {
                'content-type': 'multipart/form-data; boundary='
            }
            const onFinish = jest.fn()
            const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

            const fileStream = TestUtil.generateReadableStream( ['toma1', 'toma2', 'toma3'] )
            busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')

            busboyInstance.listeners('finish')[0].call()
            expect(uploadHandler.onFile).toHaveBeenCalled()
            expect(onFinish).toHaveBeenCalled()
        })
    })

    describe('#onFile', () => {
        test('given a stream file it should save it on disk', async () => {
            const chunks = ['hadgfsdf', 'jsjhdf', 'sdjhfjsdgf']
            const downloadsFolder = '/tmp'
            const handler = new UploadHandler({
                io: ioObject,
                socketId: '01',
                downloadsFolder
            })

            const onData = jest.fn();

            jest.spyOn(fs, fs.createWriteStream.name)
                .mockImplementation(() => TestUtil.generateWritableStream(onData))
            
            const onTransform = jest.fn()
            jest.spyOn(handler, handler.handleFileBytes.name)
                .mockImplementation(() => TestUtil.generateTransformStream(onTransform))
            
            const params = {
                fieldname: 'video',
                file: TestUtil.generateReadableStream(chunks),
                filename: 'mockFile.mov'
            }

            await handler.onFile(...Object.values(params))

            expect(onData.mock.calls.join()).toEqual(chunks.join())
            expect(onTransform.mock.calls.join()).toEqual(chunks.join())

            const expectedFilename = resolve(downloadsFolder, params.filename)
            expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
        })
    })

    describe('#handleFileBytes', () => {
        test('should call emit function and it is a transform stream', async () => {
            jest.spyOn(ioObject, ioObject.to.name)
            jest.spyOn(ioObject, ioObject.emit.name)

            const handler = new UploadHandler({
                io: ioObject,
                socketId: '01'
            })

            jest.spyOn(handler, handler.canExecute.name)
                .mockReturnValueOnce(true)
            
            const messages = ['hello']
            const source = TestUtil.generateReadableStream(messages)
            const onWrite = jest.fn()
            const target = TestUtil.generateWritableStream(onWrite)

            await pipeline(
                source,
                handler.handleFileBytes('filename.txt'),
                target
            )

            expect(ioObject.to).toHaveBeenCalledTimes(messages.length)
            expect(ioObject.emit).toHaveBeenCalledTimes(messages.length)
            expect(onWrite).toBeCalledTimes(messages.length)
            expect(onWrite.mock.calls.join()).toEqual(messages.join())

        })
        test('given message timerDelay as 2secs it should emit only two messages during 2 seconds period', async () => {
            jest.spyOn(ioObject, ioObject.emit.name)
            
            const day = '2021-10-20 01:01'
            const twoSecondsPeriod = 2000


            const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)
            
            const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
            const onSecondUpdateLastMessageSent = onFirstCanExecute
            
            const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
            
            const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

            TestUtil.mockDateNow(
                [
                    onFirstLastMessageSent,
                    onFirstCanExecute,
                    onSecondUpdateLastMessageSent,
                    onSecondCanExecute,
                    onThirdCanExecute
                ]
            )

            const messages = ["hello", "hello", "world"]
            const filename = 'filename.avi' 
            const expectedMessageSent = 2

            const source = TestUtil.generateReadableStream(messages)
            const handler = new UploadHandler({
                messageTimeDelay: twoSecondsPeriod,
                io: ioObject,
                socketId: '01'
            })

            await pipeline(
                source,
                handler.handleFileBytes(filename)
            )

            expect(ioObject.emit).toHaveBeenCalledTimes(expectedMessageSent)

            const [firstCallResult, secondCallResult] = ioObject.emit.mock.calls

            expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, {processedAlready: "hello".length, filename}])
            expect(secondCallResult).toEqual([handler.ON_UPLOAD_EVENT, {processedAlready: messages.join('').length, filename}])
        })
    })

    describe('#canExecute', () => {
      test('should return true when time is later yhan specified delay', () => {
        const timerDelay = 1000
        const uploadHandler = new UploadHandler({
            io: {},
            socketId: '',
            messageTimeDelay: timerDelay
        })

        const tickNow = TestUtil.getTimeFromDate('2021-10-20 00:00:03')
        TestUtil.mockDateNow([tickNow])

        const lastExecution = TestUtil.getTimeFromDate('2021-10-20 00:00:00')

        const result = uploadHandler.canExecute(lastExecution)
        expect(result).toBeTruthy()
      })
      test('should return false when time isnt later yhan specified delay', () => {
        const timerDelay = 3000
        const uploadHandler = new UploadHandler({
            io: {},
            socketId: '',
            messageTimeDelay: timerDelay
        })

        const now = TestUtil.getTimeFromDate('2021-10-20 00:00:01')
        TestUtil.mockDateNow([now])

        const lastExecution = TestUtil.getTimeFromDate('2021-10-20 00:00:00')

        const result = uploadHandler.canExecute(lastExecution)
        expect(result).toBeFalsy()
      })
    })
})