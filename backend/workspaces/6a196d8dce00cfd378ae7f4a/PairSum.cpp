#include <bits/stdc++.h>
using namespace std;

int main() {
    int arr[4] = {2, 7, 6, 90};
    int sz = sizeof(arr)/sizeof(arr[0]);
    bool found = false;

    for (int i = 0; i < sz; i++) {
        for (int j = i + 1; j < sz; j++) {  // j = i+1
            if (arr[i] + arr[j] == 9) {
                cout << arr[i] << " " << arr[j] << endl;
                found = true;
            }
        }
    }

    if (!found) {
        cout << "No pair found" << endl;
    }

    return 0;
}
