import {
    describe,
    test,
    expect,
    jest
} from '@jest/globals'

import fs from 'fs'
import FileHelper from '../../src/fileHelper.js'
import Routes from '../../src/routes.js'

describe('#FileHelper', () => {
    describe('#getFileStatus', () => {
        test('it should return files statuses in correct format', async () => {

            const statMock = {
                dev: 2064,
                mode: 33188,
                nlink: 1,
                uid: 1000,
                gid: 1000,
                rdev: 0,
                blksize: 4096,
                ino: 701082,
                size: 978992,
                blocks: 1920,
                atimeMs: 1631239398000,
                mtimeMs: 1631239397890,
                ctimeMs: 1631239397880,
                birthtimeMs: 1631073537282.7024,
                atime: '2021-09-10T02:03:18.000Z',
                mtime: '2021-09-10T02:03:17.890Z',
                ctime: '2021-09-10T02:03:17.880Z',
                birthtime: '2021-09-08T03:58:57.283Z'
            }

            const mockUser = 'willian';
            process.env.USER = mockUser
            const fileName = 'file.png'

            jest.spyOn(fs.promises, fs.promises.readdir.name)
                .mockResolvedValue([fileName])

            jest.spyOn(fs.promises, fs.promises.stat.name)
                .mockResolvedValue(statMock)
            
            const result = await FileHelper.getFilesStatus('/tmp')

            const expectedResult = [
                {
                    size: '979 kB',
                    lastModified: statMock.birthtime,
                    owner: mockUser,
                    file: fileName
                }
            ]

            expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`)
            expect(result).toMatchObject(expectedResult)
        })
    })
})
