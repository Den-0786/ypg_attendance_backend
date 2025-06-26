          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300">Total Records</h3>
              <p className="text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100">{attendanceData.length}</p>
            </div>
            <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-300">Congregations Present</h3>
              <p className="text-lg md:text-xl font-bold text-green-900 dark:text-green-100">{Object.keys(summary).length}</p>
            </div>
            <div className="p-3 md:p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-purple-700 dark:text-purple-300">Total Meetings</h3>
              <p className="text-lg md:text-xl font-bold text-purple-900 dark:text-purple-100">{yearEndData.length}</p>
            </div>
            <div className="p-3 md:p-4 bg-amber-50 dark:bg-orange-900 border border-amber-200 dark:border-orange-800 rounded-lg shadow-sm">
              <h3 className="text-xs md:text-sm font-semibold text-amber-700 dark:text-orange-300">Year Progress</h3>
              <p className="text-lg md:text-xl font-bold text-amber-900 dark:text-orange-100">{Math.round((new Date().getMonth() / 11) * 100)}%</p>
            </div>
          </div>

          {/* Dynamic Progress Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Local Congregations Progress */}
            <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    Local Congregations Progress
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Current Year: {new Date().getFullYear()}
                  </p>
                </div>
                <div className="relative w-16 h-16 md:w-20 md:h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-blue-200 dark:text-blue-700"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-600 dark:text-blue-300"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${getLocalProgress()} 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs md:text-sm font-bold text-blue-700 dark:text-blue-300">
                      {getLocalProgress()}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* District Executives Progress */}
            <div className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-700 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-semibold text-green-700 dark:text-green-300 mb-2">
                    District Executives Progress
                  </h3>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Current Year: {new Date().getFullYear()}
                  </p>
                </div>
                <div className="relative w-16 h-16 md:w-20 md:h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-green-200 dark:text-green-700"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-green-600 dark:text-green-300"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${getDistrictProgress()} 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs md:text-sm font-bold text-green-700 dark:text-green-300">
                      {getDistrictProgress()}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div> 