#include<bits/stdc++.h>
using namespace std;

int main() {
    int arr[] = {1,1,0,1,1,1};
    int n = 6;

    int count = 0;
    int maxi = 0;

    for(int i = 0; i < n; i++) {

        if(arr[i] == 1) {
            count++;              // streak continue
            maxi = max(maxi, count); // update max
        }
        else {
            count = 0;            // streak break
        }
    }

    cout << "Max consecutive 1s: " << maxi;

    return 0;
}