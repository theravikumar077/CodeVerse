#include <iostream>
using namespace std;

int main() {
    int sz = 5;             // size of array
    int arr[sz];
    int s = 0, e = sz - 1;  // pointers for reversing

    cout << "Enter " << sz << " elements:\n";
    for (int i = 0; i < sz; i++) {
        cin >> arr[i];
    }
 
    // reverse the array
    while (s < e) {
        swap(arr[s], arr[e]);
        s++;
        e--;
    }

    cout << "Reversed array:\n";
    for (int i = 0; i < sz; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;

    return 0;
}
