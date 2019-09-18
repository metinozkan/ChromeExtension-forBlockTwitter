(function() {
	console.log(chrome.runtime.lastError);
	if (chrome.runtime.lastError) {
		// Something went wrong
		console.warn('Whoops.. ' + chrome.runtime.lastError.message);
		// Maybe explain that to the user too?
	} else {
		const tabStorage = {};
		const networkFilters = {
			urls: [ 'https://*.twitter.com/*' ]
		};

		chrome.webRequest.onBeforeRequest.addListener(
			function(details) {
				return { cancel: true };
			},
			{ urls: [ 'https://*.twitter.com/*' ] },
			[ 'blocking' ]
		);
		chrome.webRequest.onCompleted.addListener((details) => {
			const { tabId, requestId } = details;
			if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
				return;
			}

			const request = tabStorage[tabId].requests[requestId];

			Object.assign(request, {
				endTime: details.timeStamp,
				requestDuration: details.timeStamp - request.startTime,
				status: 'complete'
			});
			console.log(tabStorage[tabId].requests[details.requestId]);
		}, networkFilters);

		chrome.webRequest.onErrorOccurred.addListener((details) => {
			const { tabId, requestId } = details;
			if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
				return;
			}

			const request = tabStorage[tabId].requests[requestId];
			Object.assign(request, {
				endTime: details.timeStamp,
				status: 'error'
			});
			console.log(tabStorage[tabId].requests[requestId]);
		}, networkFilters);

		chrome.tabs.onActivated.addListener((tab) => {
			const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
			if (!tabStorage.hasOwnProperty(tabId)) {
				tabStorage[tabId] = {
					id: tabId,
					requests: {},
					registerTime: new Date().getTime()
				};
			}
		});
		chrome.tabs.onRemoved.addListener((tab) => {
			const tabId = tab.tabId;
			if (!tabStorage.hasOwnProperty(tabId)) {
				return;
			}
			tabStorage[tabId] = null;
		});
	}
})();
